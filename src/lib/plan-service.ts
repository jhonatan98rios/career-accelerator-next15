import { Plan } from "@/lib/enums";

const PLAN_LIMITS: Record<Plan, { chatSessionsPerDay: number; chatSessionTokenLimit: number }> = {
  [Plan.BASIC]: { chatSessionsPerDay: 10, chatSessionTokenLimit: 150000 },
};

export function getPlanLimits(plan: Plan) {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS[Plan.BASIC];
}
