// Stripe Configuration - Single Source of Truth
// Public key is safe to expose in frontend code

export const STRIPE_PUBLISHABLE_KEY = 'pk_test_51LG0MfEtiKXEl2rXSf2zBbb2rx8Aw842VFvC163JCs5Ek7YZ49MmvY0kTEdJKC8awnV3vlkXzEfjesCWKjyKtCeP00vRw3Szps';

// Stripe price IDs mapped to subscription plans
// These should be created in your Stripe dashboard and updated here
export const STRIPE_PRICE_IDS = {
  monthly: 'price_1Saz2REtiKXEl2rXYGQ2Ubzq',
  '6_month': 'price_1Saz2REtiKXEl2rXkEeehr60',
  annual: 'price_1Saz2REtiKXEl2rXCGTBLH54',
} as const;

export type StripePlanId = keyof typeof STRIPE_PRICE_IDS;
