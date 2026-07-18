import { describe, it, beforeEach } from "node:test";
import { createRequire } from "node:module";

const req = createRequire(import.meta.url);

// expect is global from test-setup.ts (chai + @vitest/expect)

// ── Mock Stripe before anything imports subscription ────────────────
// ponytail: subscription.ts does `new Stripe(process.env.STRIPE_SECRET_KEY!)`
// at module top-level. Inject mock first.

const mockStripe = {
  customers: {
    create: () => Promise.resolve({ id: "cus_new" }),
    list: () => Promise.resolve({ data: [] }),
    retrieve: () => Promise.resolve({ id: "cus_existing", deleted: false }),
  },
  checkout: {
    sessions: {
      create: () => Promise.resolve({ id: "cs_test", url: "https://checkout.stripe.com/test" }),
    },
  },
  subscriptions: {
    update: () =>
      Promise.resolve({
        id: "sub_123",
        status: "active",
        cancel_at_period_end: true,
      }),
    retrieve: () =>
      Promise.resolve({
        id: "sub_test",
        status: "active",
        customer: "cus_test",
        metadata: { email: "test@test.com", profileId: "pf_test" },
      }),
  },
};

// Inject fake Stripe into require cache
const stripeKey = req.resolve("stripe");
req.cache[stripeKey] = {
  id: stripeKey,
  filename: stripeKey,
  loaded: true,
  exports: function Stripe() {
    return mockStripe;
  },
};

// Now import dependencies that use Stripe
const subscriptionModelKey = req.resolve("@/models/Subscription");
const subModel = req(subscriptionModelKey) as {
  SubscriptionStatus: Record<string, string>;
  Subscription: { findOneAndUpdate: (...args: unknown[]) => Promise<unknown> };
};

const { SubscriptionStatus } = subModel;

// Mock Profile model
const mockProfileUpdateCalls: unknown[][] = [];
const profileKey = req.resolve("@/models/Profile");
req.cache[profileKey] = {
  id: profileKey,
  filename: profileKey,
  loaded: true,
  exports: {
    Profile: {
      findOneAndUpdate: (...args: unknown[]) => {
        mockProfileUpdateCalls.push(args);
        return Promise.resolve({ _id: "pf_test" });
      },
    },
  },
};

// Mock logger
const mockLogCalls: unknown[][] = [];
const loggerKey = req.resolve("@/lib/logger");
req.cache[loggerKey] = {
  id: loggerKey,
  filename: loggerKey,
  loaded: true,
  exports: {
    LogLevel: { INFO: "info", WARN: "warn", ERROR: "error" },
    log: async (...args: unknown[]) => {
      mockLogCalls.push(args);
      return Promise.resolve();
    },
  },
};

// Now safe to import subscription (Stripe mock is in place)
const {
  syncProfileFromStripeSubscription,
  cancelSubscription,
}: {
  syncProfileFromStripeSubscription: (sub: unknown) => Promise<void>;
  cancelSubscription: (id: string) => Promise<unknown>;
} = req("@/lib/subscription") as any;

import { UserStatus } from "./enums";

function makeStripeSub(overrides: Record<string, unknown> = {}) {
  return {
    id: "sub_123",
    status: "active",
    customer: "cus_456",
    metadata: {
      email: "test@example.com",
      profileId: "pf_abc",
    },
    current_period_start: 1700000000,
    current_period_end: 1702600000,
    cancel_at_period_end: false,
    canceled_at: null,
    trial_start: null,
    trial_end: null,
    items: { data: [{ price: { id: "price_789" } }] },
    ...overrides,
  };
}

beforeEach(() => {
  mockProfileUpdateCalls.length = 0;
  mockLogCalls.length = 0;
});

// ── Status mapping tests ──────────────────────────────────────────

describe("syncProfileFromStripeSubscription — status mapping", () => {
  it("sets ACTIVE for trialing subscriptions", async () => {
    await syncProfileFromStripeSubscription(
      makeStripeSub({ status: SubscriptionStatus.TRIALING }) as any
    );
    expect(mockProfileUpdateCalls.length).toBe(1);
    expect(mockProfileUpdateCalls[0][1]).toMatchObject({ status: UserStatus.ACTIVE });
  });

  it("sets ACTIVE for active subscriptions", async () => {
    await syncProfileFromStripeSubscription(
      makeStripeSub({ status: SubscriptionStatus.ACTIVE }) as any
    );
    expect(mockProfileUpdateCalls[0][1]).toMatchObject({ status: UserStatus.ACTIVE });
  });

  it("sets INACTIVE for canceled subscriptions", async () => {
    await syncProfileFromStripeSubscription(
      makeStripeSub({ status: SubscriptionStatus.CANCELED }) as any
    );
    expect(mockProfileUpdateCalls[0][1]).toMatchObject({ status: UserStatus.INACTIVE });
  });

  it("sets INACTIVE for unpaid subscriptions", async () => {
    await syncProfileFromStripeSubscription(
      makeStripeSub({ status: SubscriptionStatus.UNPAID }) as any
    );
    expect(mockProfileUpdateCalls[0][1]).toMatchObject({ status: UserStatus.INACTIVE });
  });

  it("sets INACTIVE for incomplete_expired subscriptions", async () => {
    await syncProfileFromStripeSubscription(
      makeStripeSub({ status: SubscriptionStatus.INCOMPLETE_EXPIRED }) as any
    );
    expect(mockProfileUpdateCalls[0][1]).toMatchObject({ status: UserStatus.INACTIVE });
  });

  it("sets INACTIVE for paused subscriptions", async () => {
    await syncProfileFromStripeSubscription(
      makeStripeSub({ status: SubscriptionStatus.PAUSED }) as any
    );
    expect(mockProfileUpdateCalls[0][1]).toMatchObject({ status: UserStatus.INACTIVE });
  });

  it("keeps status unchanged for past_due (returns early)", async () => {
    await syncProfileFromStripeSubscription(
      makeStripeSub({ status: SubscriptionStatus.PAST_DUE }) as any
    );
    expect(mockProfileUpdateCalls.length).toBe(0);
  });

  it("returns early for unknown status", async () => {
    await syncProfileFromStripeSubscription(
      makeStripeSub({ status: "unknown_future_status" }) as any
    );
    expect(mockProfileUpdateCalls.length).toBe(0);
  });

  it("links profile subscriptionId and stripeCustomerId", async () => {
    await syncProfileFromStripeSubscription(
      makeStripeSub({ status: SubscriptionStatus.ACTIVE }) as any
    );
    expect(mockProfileUpdateCalls[0][1]).toMatchObject({
      subscriptionId: "sub_123",
      stripeCustomerId: "cus_456",
    });
  });

  it("updates by profileId when metadata.profileId is present", async () => {
    await syncProfileFromStripeSubscription(
      makeStripeSub({ status: SubscriptionStatus.ACTIVE }) as any
    );
    expect(mockProfileUpdateCalls[0][0]).toMatchObject({ _id: "pf_abc" });
  });

  it("falls back to email query when no profileId in metadata", async () => {
    const sub = makeStripeSub({ status: SubscriptionStatus.ACTIVE });
    (sub as any).metadata.profileId = "";
    await syncProfileFromStripeSubscription(sub as any);
    expect(mockProfileUpdateCalls[0][0]).toMatchObject({ email: "test@example.com" });
  });
});

// ── cancelSubscription ─────────────────────────────────────────────

describe("cancelSubscription", () => {
  it("calls stripe.subscriptions.update with cancel_at_period_end", async () => {
    const result = await cancelSubscription("sub_123");
    expect(result).toMatchObject({
      id: "sub_123",
      status: "active",
      cancel_at_period_end: true,
    });
  });

  it("logs cancellation request", async () => {
    await cancelSubscription("sub_456");
    const infoLogs = mockLogCalls.filter((c) => (c as [string, string, unknown])[0] === "info");
    expect(infoLogs.length).toBeGreaterThan(0);
  });
});
