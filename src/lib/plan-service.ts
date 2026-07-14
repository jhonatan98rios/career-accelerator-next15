import { Plan } from "@/lib/enums";

// ponytail: single source of truth for plan limits, add tokensUsed limit here later
const PLAN_LIMITS: Record<Plan, { chatSessionsPerDay: number }> = {
  [Plan.BASIC]: { chatSessionsPerDay: 1 },
};

export function getPlanLimits(plan: Plan) {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS[Plan.BASIC];
}
