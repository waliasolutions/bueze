/**
 * Payrexx Payment Gateway Configuration
 * Single Source of Truth for Payrexx integration
 */

import { SubscriptionPlanType } from './subscriptionPlans';

// Payrexx instance name (from secrets in edge functions)
export const PAYREXX_INSTANCE = 'wsolutions';

// Amount in Rappen (CHF cents) for each plan
// NOTE: Must match SSOT prices in src/config/subscriptionPlans.ts (× 100 for Rappen)
export const PAYREXX_PLAN_AMOUNTS: Record<Exclude<SubscriptionPlanType, 'free'>, number> = {
  monthly: 9000, // CHF 90.00
  '6_month': 51000, // CHF 510.00
  annual: 96000, // CHF 960.00
};

// SKU identifiers for subscription plans
export const PAYREXX_PLAN_SKUS: Record<Exclude<SubscriptionPlanType, 'free'>, string> = {
  monthly: 'BUEZE_MONTHLY',
  '6_month': 'BUEZE_6MONTH',
  annual: 'BUEZE_ANNUAL',
};

// Supported Swiss payment methods via Payrexx
export const PAYREXX_PAYMENT_METHODS = [
  { id: 'twint', name: 'TWINT', icon: '📱' },
  { id: 'postfinance_card', name: 'PostFinance Card', icon: '💳' },
  { id: 'postfinance_efinance', name: 'PostFinance E-Finance', icon: '🏦' },
  { id: 'visa', name: 'Visa', icon: '💳' },
  { id: 'mastercard', name: 'Mastercard', icon: '💳' },
] as const;

// Payment provider type (Payrexx only - Stripe removed)
export type PaymentProvider = 'payrexx';

/**
 * Get the amount in Rappen for a plan
 */
export function getPayrexxAmount(planType: SubscriptionPlanType): number {
  if (planType === 'free') return 0;
  return PAYREXX_PLAN_AMOUNTS[planType];
}

/**
 * Get the SKU for a plan
 */
export function getPayrexxSku(planType: SubscriptionPlanType): string {
  if (planType === 'free') return 'BUEZE_FREE';
  return PAYREXX_PLAN_SKUS[planType];
}
