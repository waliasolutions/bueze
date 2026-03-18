

# Deep QA: Payment Flow & Payrexx Integration + Grace Period Change

## QA Assessment: Payment Flow

The payment infrastructure is **well-built and robust**. No critical issues found:

- **Checkout flow**: Proper auth gating, approval checks, Payrexx gateway creation with fallback params, error handling for 502s
- **Webhook**: HMAC-SHA256 signature verification, idempotent payment recording via `upsert` on `payrexx_transaction_id`, amount/currency validation against allowlist, proper admin notifications on all error paths
- **Subscription activation**: Payment → subscription update → in-app notification → confirmation email → invoice PDF generation (non-blocking)
- **Failed payments**: Auto-renewal failures disable `auto_renew` flag, existing paid subs not reverted on failed new payments
- **Emails**: Confirmation email via `send-subscription-confirmation`, invoice email triggered by PDF generation
- **Cron jobs**: `check-subscription-expiry` at 02:00 UTC, `send-pending-payment-reminder` at 10:00 UTC

---

## Change: Grace Period from 7 days → 24 hours

### Current behavior
1. 7 days before expiry: warning email sent
2. Day of expiry: renewal email with Payrexx link sent, grace period starts
3. 7 days after expiry: downgrade to free

### Requested behavior
1. 7 days before expiry: warning/reminder email sent (keep as-is)
2. Day of expiry: renewal email with Payrexx link sent (keep, but update deadline text to 24h)
3. 24 hours after expiry (not 7 days): downgrade to free

### Changes needed

**1. `supabase/functions/check-subscription-expiry/index.ts`**
- Change `GRACE_PERIOD_DAYS = 7` → `GRACE_PERIOD_DAYS = 1`
- Update email text in PATH B: "24 Stunden" instead of grace end date 7 days out
- Update comments to reflect 24-hour grace period

**2. `src/pages/HandwerkerDashboard.tsx` (line 835)**
- Change `graceEndDate.setDate(graceEndDate.getDate() + 7)` → `+ 1`
- Update banner text to reflect 24-hour deadline instead of days

Two files changed, ~6 lines modified total.

