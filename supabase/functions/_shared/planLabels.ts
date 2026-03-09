// Shared plan labels, amounts, and configs for edge functions
// NOTE: Prices must match the SSOT in src/config/subscriptionPlans.ts (frontend).
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

/**
 * Valid amounts per plan for webhook validation (in Rappen).
 * When changing prices:
 *   1. Add new price to each plan's array
 *   2. Keep old price with a // TODO: remove after YYYY-MM-DD comment
 *   3. Update PLAN_AMOUNTS to the new price
 *   4. Remove old price after 48 hours
 */
export const VALID_PLAN_AMOUNTS: Record<string, number[]> = {
  monthly: [9000],
  '6_month': [51000],
  annual: [96000],
};

export function getPlanAmount(planType: string): number | null {
  return PLAN_AMOUNTS[planType] || null;
}

/** ISO 8601 duration intervals for Payrexx-managed subscriptions */
export const PLAN_INTERVALS: Record<string, string> = {
  monthly: 'P1M',
  '6_month': 'P6M',
  annual: 'P1Y',
};

/** Plan configurations for subscription activation (proposals limit + billing period) */
export const PLAN_CONFIGS: Record<string, { proposalsLimit: number; periodMonths: number }> = {
  monthly: { proposalsLimit: -1, periodMonths: 1 },
  '6_month': { proposalsLimit: -1, periodMonths: 6 },
  annual: { proposalsLimit: -1, periodMonths: 12 },
};
