import { describe, it, expect } from "vitest";
import {
  getInsightGuardrailState,
  getRoadmapGuardrailState,
} from "./ai-generation-guardrails";
import { RoadmapStatus } from "./enums";

// ---- helpers ----

const DAY_MS = 24 * 60 * 60 * 1000;

function hoursAgo(h: number): Date {
  return new Date(Date.now() - h * 60 * 60 * 1000);
}

function hoursFromNow(h: number): Date {
  return new Date(Date.now() + h * 60 * 60 * 1000);
}

// ---- Insight guardrail tests ----

describe("getInsightGuardrailState", () => {
  it("allows generation when no previous insight exists", () => {
    const state = getInsightGuardrailState({});
    expect(state.canGenerate).toBe(true);
    expect(state.reason).toBe("allowed");
    expect(state.bypassed).toBe(false);
    expect(state.unlockAt).toBeNull();
  });

  it("allows generation when lastInsightGeneratedAt is null", () => {
    const state = getInsightGuardrailState({
      lastInsightGeneratedAt: null,
    });
    expect(state.canGenerate).toBe(true);
    expect(state.reason).toBe("allowed");
  });

  it("blocks generation during cooldown (< 24h since last)", () => {
    const state = getInsightGuardrailState({
      lastInsightGeneratedAt: hoursAgo(1),
    });
    expect(state.canGenerate).toBe(false);
    expect(state.reason).toBe("cooldown");
    expect(state.bypassed).toBe(false);
    expect(state.unlockAt).not.toBeNull();
    // unlockAt should be ~ 23h from now
    const unlock = new Date(state.unlockAt!);
    const expectedUnlock = new Date(Date.now() + 23 * 60 * 60 * 1000);
    expect(Math.abs(unlock.getTime() - expectedUnlock.getTime())).toBeLessThan(
      10_000,
    );
  });

  it("allows generation after cooldown expires (> 24h since last)", () => {
    const state = getInsightGuardrailState({
      lastInsightGeneratedAt: hoursAgo(25),
    });
    expect(state.canGenerate).toBe(true);
    expect(state.reason).toBe("allowed");
    expect(state.unlockAt).toBeNull();
  });

  it("allows generation at exact 24h boundary", () => {
    const state = getInsightGuardrailState(
      { lastInsightGeneratedAt: hoursAgo(24) },
      new Date(),
    );
    expect(state.canGenerate).toBe(true);
    expect(state.reason).toBe("allowed");
  });

  it("bypasses guardrail when skipAiGenerationGuardrails is true", () => {
    const state = getInsightGuardrailState({
      skipAiGenerationGuardrails: true,
      lastInsightGeneratedAt: hoursAgo(1), // still in cooldown
    });
    expect(state.canGenerate).toBe(true);
    expect(state.reason).toBe("bypassed");
    expect(state.bypassed).toBe(true);
  });
});

// ---- Roadmap guardrail tests ----

function makeSteps(
  ...statuses: RoadmapStatus[]
): Array<{ status: RoadmapStatus }> {
  return statuses.map((s) => ({ status: s }));
}

describe("getRoadmapGuardrailState", () => {
  const baseProfile = {};
  const bypassProfile = { skipAiGenerationGuardrails: true };

  it("allows generation when all steps are done", () => {
    const state = getRoadmapGuardrailState(
      baseProfile,
      { steps: makeSteps(RoadmapStatus.DONE, RoadmapStatus.DONE) },
      hoursAgo(1), // insight created 1h ago — still in retry window
    );
    expect(state.canGenerate).toBe(true);
    expect(state.reason).toBe("complete");
    expect(state.retryEligible).toBe(false);
  });

  it("allows retry within 24h window when steps incomplete and retry not used", () => {
    const state = getRoadmapGuardrailState(
      baseProfile,
      {
        steps: makeSteps(RoadmapStatus.DONE, RoadmapStatus.PENDING),
      },
      hoursAgo(1),
    );
    expect(state.canGenerate).toBe(true);
    expect(state.reason).toBe("retry");
    expect(state.retryEligible).toBe(true);
    expect(state.retryWindowEndsAt).not.toBeNull();
  });

  it("blocks when retry already used", () => {
    const state = getRoadmapGuardrailState(
      baseProfile,
      {
        steps: makeSteps(RoadmapStatus.DONE, RoadmapStatus.PENDING),
        correctiveRetryUsedAt: hoursAgo(1),
      },
      hoursAgo(2),
    );
    expect(state.canGenerate).toBe(false);
    expect(state.reason).toBe("retry_used");
    expect(state.retryEligible).toBe(false);
  });

  it("blocks when retry window expired and steps incomplete", () => {
    const state = getRoadmapGuardrailState(
      baseProfile,
      {
        steps: makeSteps(RoadmapStatus.DONE, RoadmapStatus.PENDING),
      },
      hoursAgo(25), // insight created > 24h ago
    );
    expect(state.canGenerate).toBe(false);
    expect(state.reason).toBe("retry_window_expired");
    expect(state.retryEligible).toBe(false);
  });

  it("bypasses guardrail when skipAiGenerationGuardrails is true", () => {
    const state = getRoadmapGuardrailState(
      bypassProfile,
      {
        steps: makeSteps(RoadmapStatus.DONE, RoadmapStatus.PENDING),
        correctiveRetryUsedAt: hoursAgo(1), // locked for normal users
      },
      hoursAgo(25), // window expired
    );
    expect(state.canGenerate).toBe(true);
    expect(state.reason).toBe("bypassed");
    expect(state.bypassed).toBe(true);
  });

  it("bypasses even when all normal paths are locked", () => {
    // retry used + window expired + incomplete steps = triple lock
    const state = getRoadmapGuardrailState(
      bypassProfile,
      {
        steps: makeSteps(RoadmapStatus.PENDING),
        correctiveRetryUsedAt: hoursAgo(1),
      },
      hoursAgo(25),
    );
    expect(state.canGenerate).toBe(true);
    expect(state.reason).toBe("bypassed");
  });
});
