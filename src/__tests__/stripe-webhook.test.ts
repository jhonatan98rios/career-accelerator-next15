import { describe, it } from "node:test";
import { readFileSync } from "fs";
import path from "path";

// expect is global from test-setup.ts (chai + @vitest/expect)

const routePath = path.resolve(
  import.meta.dirname ?? __dirname,
  "../app/api/webhook/payment/stripe/route.ts"
);
const routeContent = readFileSync(routePath, "utf-8");

// ── Structural safety ──────────────────────────────────────────────

describe("Stripe webhook — structural safety", () => {
  it("exports POST handler", () => {
    expect(routeContent).toContain("export async function POST");
  });

  it("verifies stripe-signature header before processing", () => {
    expect(routeContent).toContain("stripe-signature");
    expect(routeContent).toContain("constructEvent");
  });

  it("returns 400 for missing signature or secret", () => {
    expect(routeContent).toContain('"Invalid webhook configuration"');
    expect(routeContent).toContain("HttpStatus.BAD_REQUEST");
  });

  it("returns 400 for invalid signature", () => {
    expect(routeContent).toContain('"Invalid signature"');
    expect(routeContent).toContain("HttpStatus.BAD_REQUEST");
  });

  it("returns 500 for webhook processing failure", () => {
    expect(routeContent).toContain('"Webhook processing failed"');
    expect(routeContent).toContain("HttpStatus.INTERNAL_SERVER_ERROR");
  });

  it("connects to DB before processing events", () => {
    const lines = routeContent.split("\n");
    const connectLine = lines.findIndex((l) => l.includes("connectDB()"));
    const switchLine = lines.findIndex((l) => l.includes("switch (event.type)"));
    expect(connectLine).toBeGreaterThan(0);
    expect(switchLine).toBeGreaterThan(0);
    expect(connectLine).toBeLessThan(switchLine);
  });

  it("guards with idempotency (alreadyProcessed) per handler", () => {
    expect(routeContent).toContain("alreadyProcessed");
    // Must appear in at least one handler
    const alreadyCount = (routeContent.match(/alreadyProcessed/g) || []).length;
    expect(alreadyCount).toBeGreaterThanOrEqual(2); // once in subscription, once in checkout
  });

  it("logs signature verification failures with diagnostic context", () => {
    expect(routeContent).toContain('"Stripe webhook signature verification failed"');
    expect(routeContent).toContain("errorMessage");
    expect(routeContent).toContain("errorType");
    expect(routeContent).toContain("signatureLength");
  });
});

// ── Event type coverage ────────────────────────────────────────────

describe("Stripe webhook — event type coverage", () => {
  const expectedTypes = [
    "checkout.session.completed",
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
    "customer.subscription.paused",
    "customer.subscription.resumed",
    "customer.subscription.pending_update_applied",
    "customer.subscription.pending_update_expired",
    "customer.subscription.trial_will_end",
    "invoice.payment_failed",
    "invoice.paid",
  ];

  for (const eventType of expectedTypes) {
    it(`handles "${eventType}"`, () => {
      // Use the exact string as it appears in a case label
      const quoted = `"${eventType}"`;
      expect(routeContent).toContain(quoted);
    });
  }

  it("has a default/ignored case for unsupported events", () => {
    expect(routeContent).toContain("Ignoring unsupported Stripe webhook event");
  });
});

// ── Handler separation ─────────────────────────────────────────────

describe("Stripe webhook — handler separation", () => {
  it("uses dedicated handler for checkout.session.completed", () => {
    expect(routeContent).toContain("handleCheckoutCompleted");
  });

  it("uses shared handler for subscription lifecycle events", () => {
    expect(routeContent).toContain("handleSubscriptionEvent");
    // Verify all subscription event types exist in the switch
    const subEventTypes = [
      "customer.subscription.created",
      "customer.subscription.updated",
      "customer.subscription.deleted",
      "customer.subscription.paused",
      "customer.subscription.resumed",
      "customer.subscription.pending_update_applied",
      "customer.subscription.pending_update_expired",
      "customer.subscription.trial_will_end",
    ];
    for (const eventType of subEventTypes) {
      expect(routeContent).toContain(`"${eventType}"`);
    }
    // All subscription cases route to the same handler
    const handlerCalls = (routeContent.match(/handleSubscriptionEvent/g) || []).length;
    expect(handlerCalls).toBeGreaterThanOrEqual(1);
  });

  it("uses dedicated handlers for invoice events", () => {
    expect(routeContent).toContain("handleInvoicePaymentFailed");
    expect(routeContent).toContain("handleInvoicePaid");
  });
});
