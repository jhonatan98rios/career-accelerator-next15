import { Plan, RoadmapStatus } from "@/lib/enums";
import { log, LogLevel } from "@/lib/logger";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

// ponytail: insight cooldown per plan — the "aha moment" urgency ladder
function insightCooldownMs(plan: Plan): number {
  switch (plan) {
    case Plan.BASIC:
      return 7 * DAY_IN_MS;
    case Plan.PLUS:
      return 48 * 60 * 60 * 1000;
    case Plan.ULTRA:
      return DAY_IN_MS;
    default:
      return 7 * DAY_IN_MS; // fallback: conservative
  }
}

type ProfileGuardrailInput = {
  lastInsightGeneratedAt?: Date | string | null;
  skipAiGenerationGuardrails?: boolean | null;
};

type RoadmapGuardrailInput = {
  steps: Array<{ status: RoadmapStatus | string }>;
};

type InsightGuardrailReason = "allowed" | "cooldown" | "bypassed";
type RoadmapGuardrailReason = "allowed" | "complete" | "incomplete" | "bypassed";

export type InsightGuardrailState = {
  canGenerate: boolean;
  reason: InsightGuardrailReason;
  unlockAt: string | null;
  bypassed: boolean;
};

export type RoadmapGuardrailState = {
  canGenerate: boolean;
  reason: RoadmapGuardrailReason;
  bypassed: boolean;
};

function toDate(value?: Date | string | null): Date | null {
  if (!value) return null;

  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function getInsightGuardrailState(
  profile: ProfileGuardrailInput,
  plan: Plan = Plan.BASIC,
  now = new Date()
): InsightGuardrailState {
  if (profile.skipAiGenerationGuardrails) {
    return {
      canGenerate: true,
      reason: "bypassed",
      unlockAt: null,
      bypassed: true,
    };
  }

  const lastInsightGeneratedAt = toDate(profile.lastInsightGeneratedAt);

  if (!lastInsightGeneratedAt) {
    return {
      canGenerate: true,
      reason: "allowed",
      unlockAt: null,
      bypassed: false,
    };
  }

  const cooldown = insightCooldownMs(plan);
  const unlockAt = new Date(lastInsightGeneratedAt.getTime() + cooldown);

  if (unlockAt <= now) {
    return {
      canGenerate: true,
      reason: "allowed",
      unlockAt: null,
      bypassed: false,
    };
  }

  void log(LogLevel.WARN, "Insight generation blocked: cooldown active", {
    reason: "cooldown",
    unlockAt: unlockAt.toISOString(),
    lastGeneratedAt: lastInsightGeneratedAt?.toISOString(),
  });

  return {
    canGenerate: false,
    reason: "cooldown",
    unlockAt: unlockAt.toISOString(),
    bypassed: false,
  };
}

export function getRoadmapGuardrailState(
  profile: ProfileGuardrailInput,
  roadmap: RoadmapGuardrailInput
): RoadmapGuardrailState {
  if (profile.skipAiGenerationGuardrails) {
    return { canGenerate: true, reason: "bypassed", bypassed: true };
  }

  // Roadmap is immutable once generated: next steps unlock only on full completion.
  const allStepsDone = roadmap.steps.every((step) => step.status === RoadmapStatus.DONE);

  return allStepsDone
    ? { canGenerate: true, reason: "complete", bypassed: false }
    : { canGenerate: false, reason: "incomplete", bypassed: false };
}
