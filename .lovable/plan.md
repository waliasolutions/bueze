
# Payrexx Payment System — Go-Live Fixes (Completed)

## All Critical & Medium Issues Resolved

### ✅ Critical Fix 1: Service-Role Gateway Creation
`create-payrexx-gateway` now supports a service-role code path. When called server-to-server (e.g., from `check-subscription-expiry`), it accepts `userId` and `userEmail` from the body instead of relying on `auth.getUser()`. Grace period renewal emails now include direct Payrexx payment links.

### ✅ Critical Fix 2: Cron Jobs Created
- `check-subscription-expiry`: daily at 02:00 UTC
- `send-pending-payment-reminder`: daily at 10:00 UTC

### ✅ Critical Fix 3: Webhook Signature Verification
`payrexx-webhook` now verifies HMAC-SHA256 signatures using `PAYREXX_API_KEY`. If the `ApiSignature` field is present in the webhook payload, it's validated against the expected hash. Mismatches are rejected with a logged warning.

### ✅ Medium Fix 4: Failed Payment Duplicate Handling
Failed payment inserts now use `upsert` with `onConflict: 'payrexx_transaction_id'` and `ignoreDuplicates: true` to prevent errors from duplicate failed webhooks.

### ✅ Medium Fix 5: PATH A0 Period Calculation
Plan downgrades now use `PLAN_CONFIGS[newPlanType].periodMonths` for correct period calculation (e.g., 6 months for `6_month` plan instead of always 30 days).

### ✅ Medium Fix 6: VAT Rate Removed
Removed hardcoded `vatRate: '8.1'` from `create-payrexx-gateway`. The company is MWST-exempt (Liechtenstein), so no VAT line should appear on the Payrexx payment page.

### ⚠️ Manual Steps Required (Permission-Restricted)
These cannot be done via Lovable and must be executed in the **Supabase Dashboard SQL Editor**:

1. **Remove stale cron jobs**:
   ```sql
   SELECT cron.unschedule(2);  -- reset-monthly-proposal-quotas (references non-existent table)
   SELECT cron.unschedule(3);  -- cleanup-pending-uploads-daily (references non-existent function)
   ```

2. **Drop duplicate index** (optional, cosmetic):
   ```sql
   DROP INDEX IF EXISTS idx_payment_history_payrexx_txn_unique;
   ```

3. **Pre-launch verification**:
   - Verify `PAYREXX_API_KEY` and `PAYREXX_INSTANCE` are set to production values
   - Verify `PAYREXX_TEST_MODE` is false or removed
   - Configure Payrexx webhook URL in Payrexx Dashboard

## System Status: Ready for Go-Live ✅
