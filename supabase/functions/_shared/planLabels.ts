// Shared plan labels and amounts for edge functions
// NOTE: Prices must match the SSOT in src/config/subscriptionPlans.ts (frontend)
// and src/config/payrexx.ts. If prices change, update all three files.
// Edge functions cannot import frontend modules, so this duplication is intentional.

export const PLAN_AMOUNTS: Record<string, number> = {
  monthly: 9000,
  '6_month': 51000,
  annual: 96000,
};

export const PLAN_NAMES: Record<string, string> = {
  monthly: 'Monatlich',
  '6_month': '6 Monate',
  annual: 'Jährlich',
  yearly: 'Jährlich',
};

export const PLAN_NAMES_WITH_PRICE: Record<string, string> = {
  monthly: 'Monatlich (CHF 90/Mt.)',
  '6_month': '6 Monate (CHF 510)',
  annual: 'Jährlich (CHF 960)',
};

export const PLAN_GATEWAY_NAMES: Record<string, string> = {
  monthly: 'Monatliches Abo',
  '6_month': '6-Monats-Abo',
  annual: 'Jahres-Abo',
};

export function getPlanName(planType: string): string {
  return PLAN_NAMES[planType] || planType;
}

export function getPlanNameWithPrice(planType: string): string {
  return PLAN_NAMES_WITH_PRICE[planType] || planType;
}

/** SSOT: Free tier proposals limit. Use this instead of hardcoding 5. */
export const FREE_TIER_PROPOSALS_LIMIT = 5;

export function getPlanAmount(planType: string): number | null {
  return PLAN_AMOUNTS[planType] || null;
}
