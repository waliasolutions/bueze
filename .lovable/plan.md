

# Payrexx Payment System — Deep QA Report (Post-Fixes)

## Status: Nearly Ready for Go-Live

All previously identified critical issues have been resolved. The system is well-architected. Below are the remaining findings.

---

## Remaining Issues

### 1. VAT Rate Hardcoded Incorrectly (Medium)

`create-payrexx-gateway` sends `vatRate: '8.1'` to Payrexx (line 128), but the company is registered in **Liechtenstein** with `mwst_mode: 'none'` and `mwst_note: 'MWST befreit (Liechtenstein)'` in billing_settings.

This means the Payrexx payment page may display an 8.1% Swiss VAT line, which is legally incorrect for a Liechtenstein-based company that is MWST-exempt.

**Fix**: Remove the `vatRate` parameter from the gateway creation, or dynamically read it from `billing_settings`. Since the company is VAT-exempt, Payrexx should show the gross amount without a tax breakdown.

### 2. Stale Cron Jobs (Low)

- **Job 2** (`reset-monthly-proposal-quotas`): Updates non-existent `public.subscriptions` table. Silently fails monthly. Should be removed.
- **Job 3** (`cleanup-pending-uploads-daily`): Calls `cleanup-pending-uploads` Edge Function which **does not exist**. Silently fails daily. Should be removed.

Both can only be removed via the Supabase Dashboard SQL Editor:
```sql
SELECT cron.unschedule(2);
SELECT cron.unschedule(3);
```

### 3. Duplicate Unique Index on payment_history (Cosmetic)

Two identical unique partial indexes exist on `payment_history.payrexx_transaction_id`:
- `idx_payment_history_payrexx_txn_unique`
- `payment_history_payrexx_transaction_id_unique`

Functionally harmless but wastes storage and slows writes marginally.

**Fix**: Drop one via SQL Editor:
```sql
DROP INDEX IF EXISTS idx_payment_history_payrexx_txn_unique;
```

---

## Confirmed Working (All Previously Fixed)

| Component | Status |
|-----------|--------|
| Cron: `check-subscription-expiry` (daily 02:00 UTC) | Active (job 4) |
| Cron: `send-pending-payment-reminder` (daily 10:00 UTC) | Active (job 5) |
| Webhook HMAC-SHA256 signature verification | Implemented |
| Service-role gateway creation (for grace period emails) | Fixed |
| Failed payment duplicate handling (upsert) | Fixed |
| PATH A0 period calculation (plan downgrades) | Fixed |
| Idempotency via `payrexx_transaction_id` unique constraint | Working |
| Amount/currency validation in webhook | Working |
| Subscription activation with correct period lengths | Working |
| Auto-renewal lifecycle (store/cancel Payrexx subscription) | Working |
| Invoice PDF generation + email | Working |
| Billing snapshot immutability | Working |
| Grace period flow (7 days + emails + downgrade) | Working |
| 7-day warning emails (cancelled vs non-cancelled) | Working |
| Checkout UI (approval gating, pending plan, error handling) | Working |
| Subscription management UI (upgrade/downgrade/cancel/undo) | Working |
| Frontend ↔ Backend price sync (90/510/960 CHF = 9000/51000/96000 Rappen) | Correct |

---

## Go-Live Checklist

| Item | Status |
|------|--------|
| Remove `vatRate: '8.1'` from gateway creation | **Must fix** |
| Remove stale cron jobs 2 & 3 (manual SQL) | Recommended |
| Drop duplicate index (manual SQL) | Optional |
| Verify `PAYREXX_API_KEY` and `PAYREXX_INSTANCE` secrets are set to production values | Manual check |
| Set `PAYREXX_TEST_MODE` to false / remove it | Manual check |
| Configure Payrexx webhook URL in Payrexx Dashboard | Manual check |

**Bottom line**: Fix the VAT rate issue, then the payment system is ready for production.

