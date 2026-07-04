import { RoadmapStatus } from "@/lib/enums";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

type ProfileGuardrailInput = {
  lastInsightGeneratedAt?: Date | string | null;
  skipAiGenerationGuardrails?: boolean | null;
};

type RoadmapGuardrailInput = {
  steps: Array<{ status: RoadmapStatus | string }>;
  correctiveRetryUsedAt?: Date | string | null;
};

type InsightGuardrailReason = "allowed" | "cooldown" | "bypassed";
type RoadmapGuardrailReason =
  | "allowed"
  | "complete"
  | "retry"
  | "incomplete"
  | "retry_used"
  | "retry_window_expired"
  | "bypassed";

export type InsightGuardrailState = {
  canGenerate: boolean;
  reason: InsightGuardrailReason;
  unlockAt: string | null;
  bypassed: boolean;
};

export type RoadmapGuardrailState = {
  canGenerate: boolean;
  reason: RoadmapGuardrailReason;
  unlockAt: string | null;
  retryWindowEndsAt: string | null;
  retryEligible: boolean;
  bypassed: boolean;
};

function toDate(value?: Date | string | null): Date | null {
  if (!value) return null;

  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function getInsightGuardrailState(
  profile: ProfileGuardrailInput,
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

  const unlockAt = new Date(lastInsightGeneratedAt.getTime() + DAY_IN_MS);

  if (unlockAt <= now) {
    return {
      canGenerate: true,
      reason: "allowed",
      unlockAt: null,
      bypassed: false,
    };
  }

  return {
    canGenerate: false,
    reason: "cooldown",
    unlockAt: unlockAt.toISOString(),
    bypassed: false,
  };
}

export function getRoadmapGuardrailState(
  profile: ProfileGuardrailInput,
  roadmap: RoadmapGuardrailInput,
  insightCreatedAt: Date | string,
  now = new Date()
): RoadmapGuardrailState {
  if (profile.skipAiGenerationGuardrails) {
    return {
      canGenerate: true,
      reason: "bypassed",
      unlockAt: null,
      retryWindowEndsAt: null,
      retryEligible: false,
      bypassed: true,
    };
  }

  const allStepsDone = roadmap.steps.every((step) => step.status === RoadmapStatus.DONE);

  if (allStepsDone) {
    return {
      canGenerate: true,
      reason: "complete",
      unlockAt: null,
      retryWindowEndsAt: null,
      retryEligible: false,
      bypassed: false,
    };
  }

  const retryWindowEndsAtDate = new Date(new Date(insightCreatedAt).getTime() + DAY_IN_MS);
  const retryWindowEndsAt = retryWindowEndsAtDate.toISOString();
  const correctiveRetryUsedAt = toDate(roadmap.correctiveRetryUsedAt);

  if (correctiveRetryUsedAt) {
    return {
      canGenerate: false,
      reason: "retry_used",
      unlockAt: null,
      retryWindowEndsAt,
      retryEligible: false,
      bypassed: false,
    };
  }

  if (retryWindowEndsAtDate > now) {
    return {
      canGenerate: true,
      reason: "retry",
      unlockAt: null,
      retryWindowEndsAt,
      retryEligible: true,
      bypassed: false,
    };
  }

  return {
    canGenerate: false,
    reason: "retry_window_expired",
    unlockAt: null,
    retryWindowEndsAt,
    retryEligible: false,
    bypassed: false,
  };
}
