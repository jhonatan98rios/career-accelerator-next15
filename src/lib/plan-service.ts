import { Plan } from "@/lib/enums";

const PLAN_LIMITS: Record<Plan, { chatSessionsPerDay: number; chatSessionTokenLimit: number; resumeGenerationsPerDay: number }> = {
  [Plan.BASIC]: { chatSessionsPerDay: 10, chatSessionTokenLimit: 150000, resumeGenerationsPerDay: 5 },
};

export function getPlanLimits(plan: Plan) {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS[Plan.BASIC];
}
