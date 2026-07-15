import { describe, it } from "node:test";
import { getPlanLimits } from "./plan-service";
import { Plan } from "./enums";

// expect is global from test-setup.ts (chai + @vitest/expect)

describe("getPlanLimits", () => {
  it("returns BASIC plan limits with expected shape", () => {
    const limits = getPlanLimits(Plan.BASIC);
    expect(limits.chatSessionsPerDay).toBeGreaterThan(0);
    expect(limits.chatSessionTokenLimit).toBeGreaterThan(0);
    expect(typeof limits.chatSessionsPerDay).toBe("number");
    expect(typeof limits.chatSessionTokenLimit).toBe("number");
  });

  it("returns the same instance for repeated calls (PLAN_LIMITS is a constant map)", () => {
    // ponytail: verify no accidental mutation of the limits map
    const a = getPlanLimits(Plan.BASIC);
    const b = getPlanLimits(Plan.BASIC);
    expect(a).toBe(b);
  });

  it("returns BASIC limits for undefined/null plan (fallback safety)", () => {
    // ponytail: if the plan field is missing or corrupted in DB, we still get limits
    const limits = getPlanLimits(undefined as unknown as Plan);
    expect(limits.chatSessionsPerDay).toBe(getPlanLimits(Plan.BASIC).chatSessionsPerDay);
    expect(limits.chatSessionTokenLimit).toBe(getPlanLimits(Plan.BASIC).chatSessionTokenLimit);
  });

  it("returns BASIC limits for unknown plan enum value", () => {
    const limits = getPlanLimits("premium" as unknown as Plan);
    expect(limits.chatSessionsPerDay).toBe(getPlanLimits(Plan.BASIC).chatSessionsPerDay);
    expect(limits.chatSessionTokenLimit).toBe(getPlanLimits(Plan.BASIC).chatSessionTokenLimit);
  });

  it("chatSessionTokenLimit is high enough for a real chat session", () => {
    const limits = getPlanLimits(Plan.BASIC);
    // ponytail: sanity check — 1500 would be suspiciously low for a chat session
    expect(limits.chatSessionTokenLimit).toBeGreaterThanOrEqual(10_000);
  });

  it("chatSessionsPerDay is at least 1", () => {
    const limits = getPlanLimits(Plan.BASIC);
    expect(limits.chatSessionsPerDay).toBeGreaterThanOrEqual(1);
  });
});
