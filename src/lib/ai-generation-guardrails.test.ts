import { describe, it } from "node:test";
import { getInsightGuardrailState, getRoadmapGuardrailState } from "./ai-generation-guardrails";
import { Plan, RoadmapStatus } from "./enums";
// expect is global from test-setup.ts (chai + @vitest/expect)

// ---- helpers ----

function hoursAgo(h: number): Date {
  return new Date(Date.now() - h * 60 * 60 * 1000);
}

function daysAgo(d: number): Date {
  return new Date(Date.now() - d * 24 * 60 * 60 * 1000);
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

  it("PREMIUM: blocks at 1h ago (24h cooldown)", () => {
    const state = getInsightGuardrailState(
      {
        lastInsightGeneratedAt: hoursAgo(1),
      },
      Plan.PREMIUM
    );
    expect(state.canGenerate).toBe(false);
    expect(state.reason).toBe("cooldown");
    expect(state.unlockAt).not.toBeNull();
  });

  it("PREMIUM: allows after 25h (24h cooldown)", () => {
    const state = getInsightGuardrailState(
      {
        lastInsightGeneratedAt: hoursAgo(25),
      },
      Plan.PREMIUM
    );
    expect(state.canGenerate).toBe(true);
    expect(state.reason).toBe("allowed");
  });

  it("INTERMEDIARY: blocks at 24h ago (48h cooldown)", () => {
    const state = getInsightGuardrailState(
      {
        lastInsightGeneratedAt: hoursAgo(24),
      },
      Plan.INTERMEDIARY
    );
    expect(state.canGenerate).toBe(false);
    expect(state.reason).toBe("cooldown");
  });

  it("INTERMEDIARY: allows after 49h (48h cooldown)", () => {
    const state = getInsightGuardrailState(
      {
        lastInsightGeneratedAt: hoursAgo(49),
      },
      Plan.INTERMEDIARY
    );
    expect(state.canGenerate).toBe(true);
    expect(state.reason).toBe("allowed");
  });

  it("BASIC: blocks at 1d ago (7d cooldown)", () => {
    const state = getInsightGuardrailState(
      {
        lastInsightGeneratedAt: daysAgo(1),
      },
      Plan.BASIC
    );
    expect(state.canGenerate).toBe(false);
    expect(state.reason).toBe("cooldown");
  });

  it("BASIC: blocks at 6d ago (7d cooldown)", () => {
    const state = getInsightGuardrailState(
      {
        lastInsightGeneratedAt: daysAgo(6),
      },
      Plan.BASIC
    );
    expect(state.canGenerate).toBe(false);
    expect(state.reason).toBe("cooldown");
  });

  it("BASIC: allows after 8d (7d cooldown)", () => {
    const state = getInsightGuardrailState(
      {
        lastInsightGeneratedAt: daysAgo(8),
      },
      Plan.BASIC
    );
    expect(state.canGenerate).toBe(true);
    expect(state.reason).toBe("allowed");
  });

  it("bypasses guardrail when skipAiGenerationGuardrails is true (regardless of plan)", () => {
    // BASIC has 7d cooldown — bypass should work even 1h after generation
    const state = getInsightGuardrailState(
      {
        skipAiGenerationGuardrails: true,
        lastInsightGeneratedAt: hoursAgo(1),
      },
      Plan.BASIC
    );
    expect(state.canGenerate).toBe(true);
    expect(state.reason).toBe("bypassed");
    expect(state.bypassed).toBe(true);
  });
});

// ---- Roadmap guardrail tests ----

function makeSteps(...statuses: RoadmapStatus[]): Array<{ status: RoadmapStatus }> {
  return statuses.map((s) => ({ status: s }));
}

describe("getRoadmapGuardrailState", () => {
  const baseProfile = {};
  const bypassProfile = { skipAiGenerationGuardrails: true };

  it("allows generation when all steps are done", () => {
    const state = getRoadmapGuardrailState(baseProfile, {
      steps: makeSteps(RoadmapStatus.DONE, RoadmapStatus.DONE),
    });
    expect(state.canGenerate).toBe(true);
    expect(state.reason).toBe("complete");
    expect(state.bypassed).toBe(false);
  });

  it("blocks generation when steps are incomplete", () => {
    const state = getRoadmapGuardrailState(baseProfile, {
      steps: makeSteps(RoadmapStatus.DONE, RoadmapStatus.PENDING),
    });
    expect(state.canGenerate).toBe(false);
    expect(state.reason).toBe("incomplete");
  });

  it("blocks generation for a fully pending roadmap", () => {
    const state = getRoadmapGuardrailState(baseProfile, {
      steps: makeSteps(RoadmapStatus.PENDING, RoadmapStatus.PENDING),
    });
    expect(state.canGenerate).toBe(false);
    expect(state.reason).toBe("incomplete");
  });

  it("allows generation for an empty roadmap", () => {
    const state = getRoadmapGuardrailState(baseProfile, { steps: [] });
    expect(state.canGenerate).toBe(true);
    expect(state.reason).toBe("complete");
  });

  it("bypasses guardrail when skipAiGenerationGuardrails is true", () => {
    const state = getRoadmapGuardrailState(bypassProfile, {
      steps: makeSteps(RoadmapStatus.PENDING),
    });
    expect(state.canGenerate).toBe(true);
    expect(state.reason).toBe("bypassed");
    expect(state.bypassed).toBe(true);
  });
});
