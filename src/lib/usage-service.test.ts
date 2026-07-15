import { describe, it, beforeEach } from "node:test";
import { createRequire } from "node:module";

const req = createRequire(import.meta.url);

// ponytail: mock DailyUsage via require.cache before importing usage-service.
// tsx transpiles to CJS, so require works.
function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

const mockFindOneAndUpdateCalls: unknown[][] = [];
let mockResolvedValue: unknown = null;

function mockResolvedValueOnce(val: unknown) {
  mockResolvedValue = val;
}

function createMockFindOneAndUpdate() {
  return (...args: unknown[]) => {
    mockFindOneAndUpdateCalls.push(args);
    return Promise.resolve(mockResolvedValue);
  };
}

// Inject mock into require cache for the DailyUsage model
const dailyUsageKey = req.resolve("@/models/DailyUsage");
req.cache[dailyUsageKey] = {
  id: dailyUsageKey,
  filename: dailyUsageKey,
  loaded: true,
  exports: {
    DailyUsage: {
      findOneAndUpdate: createMockFindOneAndUpdate(),
    },
  },
};

// Now import modules under test
const {
  getTodayUsage,
  canStartChatSession,
  registerChatSession,
}: {
  getTodayUsage: (profileId: string) => Promise<Record<string, unknown>>;
  canStartChatSession: (profileId: string, plan: string) => Promise<boolean>;
  registerChatSession: (profileId: string) => Promise<Record<string, unknown>>;
} = req("./usage-service");

const { Plan } = req("./enums") as { Plan: { BASIC: string } };

function makeDailyUsage(sessionsStarted: number) {
  return {
    profileId: "pf_test",
    date: todayStr(),
    chat: { sessionsStarted },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

beforeEach(() => {
  mockFindOneAndUpdateCalls.length = 0;
  mockResolvedValue = null;
});

// ── getTodayUsage ──────────────────────────────────────────────────

describe("getTodayUsage", () => {
  it("returns an existing usage document", async () => {
    const doc = makeDailyUsage(3);
    mockResolvedValueOnce(doc);

    const result = await getTodayUsage("pf_test");
    expect(result).toBe(doc as unknown as typeof result);
    expect(mockFindOneAndUpdateCalls.length).toBe(1);
    expect(mockFindOneAndUpdateCalls[0][2]).toMatchObject({ upsert: true, new: true });
  });

  it("creates a new document on first call (upsert)", async () => {
    const doc = makeDailyUsage(0);
    mockResolvedValueOnce(doc);

    const result = await getTodayUsage("pf_new");
    expect((result as ReturnType<typeof makeDailyUsage>).chat.sessionsStarted).toBe(0);
  });

  it("queries by profileId and today's date", async () => {
    mockResolvedValueOnce(makeDailyUsage(0));

    await getTodayUsage("pf_abc");
    expect(mockFindOneAndUpdateCalls[0][0]).toMatchObject({ profileId: "pf_abc" });
    expect(mockFindOneAndUpdateCalls[0][0]).toHaveProperty("date");
    expect((mockFindOneAndUpdateCalls[0][0] as Record<string, string>).date).toMatch(
      /^\d{4}-\d{2}-\d{2}$/
    );
  });
});

// ── canStartChatSession ────────────────────────────────────────────

describe("canStartChatSession", () => {
  it("returns true when under the daily limit", async () => {
    mockResolvedValueOnce(makeDailyUsage(3));
    expect(await canStartChatSession("pf_test", Plan.BASIC)).toBe(true);
  });

  it("returns false when at the daily limit", async () => {
    mockResolvedValueOnce(makeDailyUsage(10));
    expect(await canStartChatSession("pf_test", Plan.BASIC)).toBe(false);
  });

  it("returns false when over the daily limit (bypass recovery)", async () => {
    mockResolvedValueOnce(makeDailyUsage(11));
    expect(await canStartChatSession("pf_test", Plan.BASIC)).toBe(false);
  });

  it("returns true at sessionsStarted = limit - 1", async () => {
    mockResolvedValueOnce(makeDailyUsage(9));
    expect(await canStartChatSession("pf_test", Plan.BASIC)).toBe(true);
  });

  it("allows on first session ever (sessionsStarted=0)", async () => {
    mockResolvedValueOnce(makeDailyUsage(0));
    expect(await canStartChatSession("pf_new", Plan.BASIC)).toBe(true);
  });
});

// ── registerChatSession ────────────────────────────────────────────

describe("registerChatSession", () => {
  it("increments sessionsStarted atomically via $inc", async () => {
    const updated = makeDailyUsage(1);
    mockResolvedValueOnce(updated);

    const result = await registerChatSession("pf_test");
    expect(result).toBe(updated as unknown as typeof result);
    expect(mockFindOneAndUpdateCalls[0][1]).toMatchObject({
      $inc: { "chat.sessionsStarted": 1 },
    });
    expect(mockFindOneAndUpdateCalls[0][2]).toMatchObject({ upsert: true, new: true });
  });

  it("uses $inc not a read+write (no client-side race)", async () => {
    mockResolvedValueOnce(makeDailyUsage(5));

    await registerChatSession("pf_test");

    const args = mockFindOneAndUpdateCalls[0];
    expect(args[1]).toHaveProperty("$inc");
    expect((args[1] as Record<string, Record<string, number>>).$inc["chat.sessionsStarted"]).toBe(
      1
    );
  });

  it("creates a new document with sessionsStarted=1 if none exists", async () => {
    const doc = makeDailyUsage(1);
    mockResolvedValueOnce(doc);

    const result = await registerChatSession("pf_new");
    expect(
      (result as ReturnType<typeof makeDailyUsage>).chat.sessionsStarted
    ).toBe(1);
  });
});

// ── TOCTOU: canStart → register sequence ──────────────────────────

describe("session limit enforcement integrity", () => {
  it("two back-to-back canStart calls at limit-1 both pass (TOCTOU gap documented)", async () => {
    const doc = makeDailyUsage(9);
    // Both calls read the same doc — gap is in the read-then-act pattern
    mockResolvedValueOnce(doc);
    const a = await canStartChatSession("pf_test", Plan.BASIC);

    mockResolvedValueOnce(doc);
    const b = await canStartChatSession("pf_test", Plan.BASIC);

    expect(a).toBe(true);
    expect(b).toBe(true);
    // Both pass — TOCTOU gap. Mitigation: registerChatSession uses atomic $inc.
    // If this becomes a real problem: wrap check+register in a MongoDB transaction.
  });
});
