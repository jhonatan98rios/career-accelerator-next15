import { Plan } from "@/lib/enums";

type PlanLimits = {
  chatSessionsPerDay: number;
  chatSessionTokenLimit: number;
  resumeGenerationsPerDay: number;
};

const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  [Plan.BASIC]: { chatSessionsPerDay: 0, chatSessionTokenLimit: 0, resumeGenerationsPerDay: 3 },
  [Plan.PLUS]: {
    chatSessionsPerDay: 3,
    chatSessionTokenLimit: 150000,
    resumeGenerationsPerDay: 10,
  },
  [Plan.ULTRA]: {
    chatSessionsPerDay: 10,
    chatSessionTokenLimit: 300000,
    resumeGenerationsPerDay: 30,
  },
};

export function getPlanLimits(plan: Plan) {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS[Plan.BASIC];
}

// ponytail: feature gate — chat only available from PLUS up
export function isChatAvailable(plan: Plan): boolean {
  return getPlanLimits(plan).chatSessionsPerDay > 0;
}

const PLAN_LABELS: Record<Plan, { name: string; price: string }> = {
  [Plan.BASIC]: { name: "Básico", price: "R$29,90/mês" },
  [Plan.PLUS]: { name: "Acelera.ai Plus", price: "R$49,90/mês" },
  [Plan.ULTRA]: { name: "Acelera.ai Ultra", price: "R$99,90/mês" },
};

// ponytail: tier order for upgrade logic
const PLAN_TIERS: Plan[] = [Plan.BASIC, Plan.PLUS, Plan.ULTRA];

export function getPlanLabel(plan: Plan) {
  return PLAN_LABELS[plan] ?? PLAN_LABELS[Plan.BASIC];
}

export function getNextPlan(plan: Plan): Plan | null {
  const idx = PLAN_TIERS.indexOf(plan);
  if (idx < 0 || idx >= PLAN_TIERS.length - 1) return null;
  return PLAN_TIERS[idx + 1];
}

export function getLowerPlans(plan: Plan): Plan[] {
  const idx = PLAN_TIERS.indexOf(plan);
  if (idx <= 0) return [];
  return PLAN_TIERS.slice(0, idx);
}
