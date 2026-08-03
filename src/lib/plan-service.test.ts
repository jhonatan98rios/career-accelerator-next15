import { describe, it } from "node:test";
import {
  getPlanLimits,
  isChatAvailable,
  getPlanLabel,
  getNextPlan,
  getLowerPlans,
} from "./plan-service";
import { Plan } from "./enums";

// expect is global from test-setup.ts (chai + @vitest/expect)

describe("getPlanLimits", () => {
  it("returns BASIC plan limits with expected shape", () => {
    const limits = getPlanLimits(Plan.BASIC);
    expect(limits.chatSessionsPerDay).toBe(0); // ponytail: BASIC has no chat
    expect(limits.chatSessionTokenLimit).toBe(0);
    expect(limits.resumeGenerationsPerDay).toBe(3);
    expect(typeof limits.chatSessionsPerDay).toBe("number");
    expect(typeof limits.resumeGenerationsPerDay).toBe("number");
  });

  it("returns PLUS plan limits", () => {
    const limits = getPlanLimits(Plan.PLUS);
    expect(limits.chatSessionsPerDay).toBe(3);
    expect(limits.chatSessionTokenLimit).toBe(150000);
    expect(limits.resumeGenerationsPerDay).toBe(10);
  });

  it("returns ULTRA plan limits", () => {
    const limits = getPlanLimits(Plan.ULTRA);
    expect(limits.chatSessionsPerDay).toBe(10);
    expect(limits.chatSessionTokenLimit).toBe(300000);
    expect(limits.resumeGenerationsPerDay).toBe(30);
  });

  it("resume limits increase with plan tier", () => {
    const basic = getPlanLimits(Plan.BASIC);
    const plus = getPlanLimits(Plan.PLUS);
    const ultra = getPlanLimits(Plan.ULTRA);
    expect(basic.resumeGenerationsPerDay).toBeLessThan(plus.resumeGenerationsPerDay);
    expect(plus.resumeGenerationsPerDay).toBeLessThan(ultra.resumeGenerationsPerDay);
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
    // ponytail: "platinum" is not in the enum — fallback kicks in
    const limits = getPlanLimits("platinum" as unknown as Plan);
    expect(limits.chatSessionsPerDay).toBe(getPlanLimits(Plan.BASIC).chatSessionsPerDay);
    expect(limits.chatSessionTokenLimit).toBe(getPlanLimits(Plan.BASIC).chatSessionTokenLimit);
  });

  it("chatSessionTokenLimit is high enough for a real chat session (plans with chat)", () => {
    // ponytail: sanity check — 1500 would be suspiciously low for a chat session
    expect(getPlanLimits(Plan.PLUS).chatSessionTokenLimit).toBeGreaterThanOrEqual(10_000);
    expect(getPlanLimits(Plan.ULTRA).chatSessionTokenLimit).toBeGreaterThanOrEqual(10_000);
  });

  it("PLUS and ULTRA have at least 1 chat session", () => {
    expect(getPlanLimits(Plan.PLUS).chatSessionsPerDay).toBeGreaterThanOrEqual(1);
    expect(getPlanLimits(Plan.ULTRA).chatSessionsPerDay).toBeGreaterThanOrEqual(1);
  });

  it("BASIC has chat sessions disabled (0)", () => {
    expect(getPlanLimits(Plan.BASIC).chatSessionsPerDay).toBe(0);
    expect(getPlanLimits(Plan.BASIC).chatSessionTokenLimit).toBe(0);
  });

  it("isChatAvailable returns false for BASIC", () => {
    expect(isChatAvailable(Plan.BASIC)).toBe(false);
  });

  it("isChatAvailable returns true for PLUS", () => {
    expect(isChatAvailable(Plan.PLUS)).toBe(true);
  });

  it("isChatAvailable returns true for ULTRA", () => {
    expect(isChatAvailable(Plan.ULTRA)).toBe(true);
  });

  it("getPlanLabel returns correct labels", () => {
    expect(getPlanLabel(Plan.BASIC).name).toBe("Básico");
    expect(getPlanLabel(Plan.PLUS).name).toBe("Acelera.ai Plus");
    expect(getPlanLabel(Plan.ULTRA).name).toBe("Acelera.ai Ultra");
  });

  it("getNextPlan returns the next tier", () => {
    expect(getNextPlan(Plan.BASIC)).toBe(Plan.PLUS);
    expect(getNextPlan(Plan.PLUS)).toBe(Plan.ULTRA);
    expect(getNextPlan(Plan.ULTRA)).toBeNull();
  });

  it("getLowerPlans returns plans below current tier", () => {
    expect(getLowerPlans(Plan.BASIC)).toEqual([]);
    expect(getLowerPlans(Plan.PLUS)).toEqual([Plan.BASIC]);
    expect(getLowerPlans(Plan.ULTRA)).toEqual([Plan.BASIC, Plan.PLUS]);
  });
});
