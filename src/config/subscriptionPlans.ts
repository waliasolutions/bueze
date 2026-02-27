/**
 * Single Source of Truth for Subscription Plans
 * All subscription-related configuration should reference this file
 */

export type SubscriptionPlanType = 'free' | 'monthly' | '6_month' | 'annual';

export interface SubscriptionPlan {
  id: SubscriptionPlanType;
  name: string;
  displayName: string;
  price: number; // in CHF
  pricePerMonth: number; // effective monthly price
  billingCycle: 'monthly' | '6_month' | 'annual' | null;
  features: string[];
  proposalsLimit: number; // -1 = unlimited, number = max proposals per month
  popular?: boolean;
  savings?: string; // display text for savings
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlanType, SubscriptionPlan> = {
  free: {
    id: 'free',
    name: 'Free',
    displayName: 'Kostenlos',
    price: 0,
    pricePerMonth: 0,
    billingCycle: null,
    features: [
      '5 Offerten pro Monat',
      'Kontaktdetails nach Annahme',
      'Kein Abo erforderlich',
    ],
    proposalsLimit: 5,
  },
  monthly: {
    id: 'monthly',
    name: 'Monthly',
    displayName: 'Monatlich',
    price: 90,
    pricePerMonth: 90,
    billingCycle: 'monthly',
    features: [
      'Unbegrenzte Offerten',
      'Alle Anfragen durchsuchen',
      'Monatlich kündbar',
    ],
    proposalsLimit: -1,
    popular: true,
  },
  '6_month': {
    id: '6_month',
    name: '6-Month',
    displayName: '6 Monate',
    price: 510,
    pricePerMonth: 85,
    billingCycle: '6_month',
    features: [
      'Unbegrenzte Offerten',
      'Alle Anfragen durchsuchen',
      'CHF 5/Monat gespart',
    ],
    proposalsLimit: -1,
    savings: 'Sparen Sie CHF 30',
  },
  annual: {
    id: 'annual',
    name: 'Annual',
    displayName: 'Jährlich',
    price: 960,
    pricePerMonth: 80,
    billingCycle: 'annual',
    features: [
      'Unbegrenzte Offerten',
      'Alle Anfragen durchsuchen',
      'Beste Preis-Leistung',
    ],
    proposalsLimit: -1,
    savings: 'Sparen Sie CHF 120',
  },
};

export const SUBSCRIPTION_PLAN_LIST = Object.values(SUBSCRIPTION_PLANS);

/** SSOT: Free tier proposals limit. Use this instead of hardcoding 5. */
export const FREE_TIER_PROPOSALS_LIMIT = SUBSCRIPTION_PLANS.free.proposalsLimit;

/**
 * Get plan configuration by ID
 */
export function getPlanById(planId: SubscriptionPlanType): SubscriptionPlan {
  return SUBSCRIPTION_PLANS[planId];
}

/**
 * Check if a plan has unlimited proposals
 */
export function hasUnlimitedProposals(planId: SubscriptionPlanType): boolean {
  return SUBSCRIPTION_PLANS[planId].proposalsLimit === -1;
}

/**
 * Get the monthly proposal limit for a plan
 */
export function getProposalLimit(planId: SubscriptionPlanType): number {
  return SUBSCRIPTION_PLANS[planId].proposalsLimit;
}

/**
 * Format price in CHF
 */
export function formatPrice(price: number): string {
  return `CHF ${price}`;
}

/**
 * Format price with per-month indication
 */
export function formatPricePerMonth(plan: SubscriptionPlan): string {
  if (plan.price === 0) return 'Kostenlos';
  if (plan.billingCycle === 'monthly') return `${formatPrice(plan.price)}/Monat`;
  return `${formatPrice(plan.price)} (${formatPrice(plan.pricePerMonth)}/Monat)`;
}
