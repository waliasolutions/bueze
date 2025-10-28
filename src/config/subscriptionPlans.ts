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
  viewsLimit: number; // -1 = unlimited
  leadsIncluded: number; // -1 = unlimited
  leadPrice: number; // price per additional lead in CHF (0 if included)
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
      '2 Lead-Ansichten pro Monat',
      'Keine Kontaktdaten sichtbar',
      'Einzelne Leads kaufbar',
      'CHF 20 pro Lead',
    ],
    viewsLimit: 2,
    leadsIncluded: 0,
    leadPrice: 20,
  },
  monthly: {
    id: 'monthly',
    name: 'Monthly',
    displayName: 'Monatlich',
    price: 90,
    pricePerMonth: 90,
    billingCycle: 'monthly',
    features: [
      'Unbegrenzte Lead-Ansichten',
      'Alle Kontaktdaten sichtbar',
      'CHF 20 pro Lead',
      'Keine versteckten Kosten',
      'Monatlich kündbar',
    ],
    viewsLimit: -1,
    leadsIncluded: -1,
    leadPrice: 20,
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
      'Unbegrenzte Lead-Ansichten',
      'Alle Kontaktdaten sichtbar',
      'CHF 20 pro Lead',
      'CHF 5/Monat gespart',
      '6 Monate Laufzeit',
    ],
    viewsLimit: -1,
    leadsIncluded: -1,
    leadPrice: 20,
    savings: 'Spare CHF 30',
  },
  annual: {
    id: 'annual',
    name: 'Annual',
    displayName: 'Jährlich',
    price: 960,
    pricePerMonth: 80,
    billingCycle: 'annual',
    features: [
      'Unbegrenzte Lead-Ansichten',
      'Alle Kontaktdaten sichtbar',
      'CHF 20 pro Lead',
      'CHF 10/Monat gespart',
      'Beste Preis-Leistung',
    ],
    viewsLimit: -1,
    leadsIncluded: -1,
    leadPrice: 20,
    savings: 'Spare CHF 120',
  },
};

export const SUBSCRIPTION_PLAN_LIST = Object.values(SUBSCRIPTION_PLANS);

/**
 * Get plan configuration by ID
 */
export function getPlanById(planId: SubscriptionPlanType): SubscriptionPlan {
  return SUBSCRIPTION_PLANS[planId];
}

/**
 * Check if a plan has unlimited views
 */
export function hasUnlimitedViews(planId: SubscriptionPlanType): boolean {
  return SUBSCRIPTION_PLANS[planId].viewsLimit === -1;
}

/**
 * Get the price for purchasing a lead based on subscription plan
 */
export function getLeadPrice(planId: SubscriptionPlanType): number {
  return SUBSCRIPTION_PLANS[planId].leadPrice;
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
