

# Payrexx Payment System — Deep QA Report

## Overall Assessment
The payment integration is well-architected with proper idempotency, error handling, and subscription lifecycle management. However, there are **3 critical issues** and **4 medium issues** that should be fixed before going live.

---

## Critical Issues

### 1. Grace Period Gateway Creation Will Fail (Auth Bug)
`check-subscription-expiry` calls `create-payrexx-gateway` via `supabase.functions.invoke()` using a **service role** client. But `create-payrexx-gateway` requires a **user JWT** — it calls `supabase.auth.getUser()` to extract `userId` and `userEmail`. When invoked server-to-server with the service role key, `auth.getUser()` returns the service role identity, not the target handwerker.

The function also passes `userId` in the body but never reads it — it always uses the authenticated user's ID.

**Impact**: Renewal emails in the grace period will contain a fallback `/checkout` URL instead of a direct Payrexx payment link. The payment still works via the fallback, but the UX is degraded.

**Fix**: Add a service-role code path to `create-payrexx-gateway` that accepts `userId` and `userEmail` from the body when the caller is authenticated via service role. Alternatively, create the Payrexx gateway directly in `check-subscription-expiry` using the shared `generateSignature` helper (avoids the inter-function call entirely).

### 2. No Cron Jobs for Subscription Expiry & Payment Reminders
The `check-subscription-expiry` and `send-pending-payment-reminder` Edge Functions exist but have **no cron jobs scheduled**. The only cron jobs in migrations are for `proposal-deadline-reminder` and a stale `reset-monthly-proposal-quotas` (which references a non-existent `subscriptions` table).

**Impact**: Subscriptions will never auto-downgrade, grace period emails will never send, and pending payment reminders will never fire. The entire subscription lifecycle is broken without manual intervention.

**Fix**: Create cron jobs for both functions:
- `check-subscription-expiry`: daily at 02:00 UTC
- `send-pending-payment-reminder`: daily at 10:00 UTC

### 3. Webhook Has No Signature Verification
The `payrexx-webhook` endpoint has `verify_jwt = false` and performs **no HMAC/signature verification** on incoming requests. The code comments acknowledge this: "Payrexx does not send a signature header for webhooks."

However, Payrexx **does** support webhook signatures (via API secret). Without verification, anyone who discovers the webhook URL can forge payment confirmations and activate subscriptions for free.

**Impact**: Critical security vulnerability — subscription fraud is trivially possible.

**Fix**: Investigate Payrexx's webhook signature mechanism. If Payrexx signs webhooks, implement HMAC verification. If not, add a shared secret as a query parameter or header that you configure in Payrexx's webhook settings, and validate it in the function.

---

## Medium Issues

### 4. Stale Cron Job References Non-Existent Table
The `reset-monthly-proposal-quotas` cron job updates `public.subscriptions` which doesn't exist (the table is `handwerker_subscriptions`). This job silently fails every month.

**Fix**: Drop the stale cron job, or update it to reference `handwerker_subscriptions`. Note: the `can_submit_proposal()` function already handles period resets, so this cron may be unnecessary.

### 5. Price Mismatch Risk Between Frontend and Backend
Frontend prices (in CHF) and backend prices (in Rappen) are maintained in two separate files:
- `src/config/subscriptionPlans.ts`: 90, 510, 960 (CHF)
- `supabase/functions/_shared/planLabels.ts`: 9000, 51000, 96000 (Rappen)

These are correctly synchronized now, but there's no automated check. A future price change in one file without the other would cause webhook amount validation to reject legitimate payments.

**Fix**: Add a comment cross-reference (already exists — good). Consider a build-time assertion test.

### 6. `payment_history` Failed Payment Insert May Conflict
When a payment fails (declined/cancelled), the webhook inserts into `payment_history` without `onConflict`. If Payrexx sends duplicate failed webhooks for the same `transactionId`, the unique index on `payrexx_transaction_id` will cause an unhandled error.

**Fix**: Use `upsert` with `onConflict: 'payrexx_transaction_id'` and `ignoreDuplicates: true` for failed payment inserts, same as for successful ones.

### 7. `check-subscription-expiry` PATH A0 Sets Wrong Period End
For plan downgrades (PATH A0), it sets `current_period_end` to `thirtyDaysFromNow` regardless of the new plan's actual billing period. A switch from annual to monthly would get a 30-day period (correct), but a switch to 6-month would also get 30 days (incorrect — should be ~180 days). However, since the user hasn't paid for the new plan yet, this is debatable.

---

## Confirmed Working

- **Gateway creation**: Proper credential verification, fallback payload, subscription params
- **Webhook idempotency**: Unique constraint on `payrexx_transaction_id` prevents double-processing
- **Amount/currency validation**: Webhook validates against allowlist
- **Subscription activation**: Correct period calculation, proposals_limit, notification + email
- **Auto-renewal lifecycle**: Payrexx subscription ID stored, cancellation works (both API and local DB)
- **Invoice generation**: PDF created, uploaded to storage, email sent with attachment
- **Billing snapshot**: Immutable company data captured at invoice time
- **Failed payment handling**: Distinguishes auto-renewal failures from first-time failures
- **Checkout UI**: Proper approval gating, pending plan flow, error handling
- **Subscription management UI**: Upgrade, downgrade, cancel, undo cancellation all present
- **Payment success page**: Clean redirect to profile with success param

---

## Summary: What's Needed Before Go-Live

| Priority | Issue | Effort |
|----------|-------|--------|
| **Critical** | Create cron jobs for `check-subscription-expiry` + `send-pending-payment-reminder` | SQL insert (no code) |
| **Critical** | Webhook signature verification or shared secret | Medium |
| **Critical** | Fix service-role gateway creation for grace period emails | Small-medium |
| **Medium** | Fix failed payment duplicate webhook handling | Small |
| **Medium** | Remove stale `reset-monthly-proposal-quotas` cron | Small |
| **Low** | Fix PATH A0 period calculation for non-monthly plans | Small |

