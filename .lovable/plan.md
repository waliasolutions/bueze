

# Payrexx Integration Implementation Plan

## Overview
Now that you've confirmed the Payrexx secrets (PAYREXX_API_KEY and PAYREXX_INSTANCE: wsolutions), I'll implement the complete Payrexx payment integration with Payrexx as the default payment provider for Swiss customers.

---

## Files to Create

### 1. `src/config/payrexx.ts` - Payrexx Configuration (SSOT)
Configuration file containing:
- Instance name: `wsolutions`
- Amount mapping for each plan (in Rappen/CHF cents)
- SKU identifiers for subscriptions
- Supported payment methods (TWINT, PostFinance, etc.)

### 2. `supabase/functions/create-payrexx-gateway/index.ts` - Gateway Creation
Edge function that:
- Receives plan type, success/cancel URLs from authenticated user
- Creates a Payrexx Gateway via their API
- Returns the payment URL for redirect
- Stores pending transaction reference

### 3. `supabase/functions/payrexx-webhook/index.ts` - Webhook Handler
Edge function that:
- Receives transaction status updates from Payrexx
- Handles `confirmed` status → activates subscription
- Handles `failed`/`declined` → reverts to free tier
- Records payment in `payment_history` table with `payment_provider: 'payrexx'`
- Sends confirmation emails

---

## Files to Modify

### 4. `supabase/config.toml` - Add Function Configs
```toml
[functions.create-payrexx-gateway]
verify_jwt = true

[functions.payrexx-webhook]
verify_jwt = false
```

### 5. `src/pages/Checkout.tsx` - Add Payment Method Selection
Updates include:
- New state for `paymentMethod` (default: 'payrexx')
- Payment method selector UI with:
  - **Payrexx (Default)**: TWINT, PostFinance, Kreditkarte
  - **Stripe**: Internationale Kreditkarten
- Modified `handleCheckout` to route to correct provider
- Updated payment info section showing Swiss payment methods

---

## Technical Flow

```text
User selects plan → Chooses payment method (Payrexx default)
                         ↓
         create-payrexx-gateway edge function
                         ↓
         Payrexx API creates Gateway
                         ↓
         User redirected to Payrexx hosted page
                         ↓
         User completes payment (TWINT/PostFinance/Card)
                         ↓
         Payrexx sends webhook to payrexx-webhook
                         ↓
         Webhook updates subscription + records payment
                         ↓
         User redirected to success page
```

---

## Implementation Details

### Payrexx API Integration
- **Endpoint**: `https://api.payrexx.com/v1.0/Gateway/?instance=wsolutions`
- **Authentication**: HMAC-SHA256 signature using API key
- **Reference ID Format**: `{user_id}-{plan_type}-{timestamp}` for webhook correlation

### Payment History Recording
Both Stripe and Payrexx payments are recorded with:
- `payment_provider`: 'stripe' or 'payrexx'
- `payrexx_transaction_id`: For Payrexx transactions

### Error Handling
- Failed payments revert subscription to free tier
- Admin notifications created for payment failures
- All errors logged for debugging

---

## Summary of Changes

| File | Action | Purpose |
|------|--------|---------|
| `src/config/payrexx.ts` | Create | SSOT for Payrexx config |
| `supabase/functions/create-payrexx-gateway/index.ts` | Create | Gateway creation |
| `supabase/functions/payrexx-webhook/index.ts` | Create | Webhook handler |
| `supabase/config.toml` | Modify | Add function configs |
| `src/pages/Checkout.tsx` | Modify | Add payment method selector (Payrexx default) |

All changes follow existing SSOT patterns and maintain the established design system. Payrexx will be the default payment option with Swiss-specific payment methods prominently displayed.

