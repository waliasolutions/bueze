

# Fix Payments & Subscriptions: Auto-Renewal, Cancellation, Grace Period

## Changes

### 1. Migration: Add `renewal_reminder_sent` + performance index

```sql
ALTER TABLE handwerker_subscriptions 
ADD COLUMN IF NOT EXISTS renewal_reminder_sent BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_subs_expiry_logic 
ON handwerker_subscriptions (current_period_end, pending_plan, renewal_reminder_sent);
```

### 2. Rewrite `check-subscription-expiry` with two-path logic

**File: `supabase/functions/check-subscription-expiry/index.ts`**

Split into three query paths:

**Path A — Cancelled subs** (`pending_plan = 'free'` AND `current_period_end < now`):
- Downgrade to free immediately (current behavior)
- Send "Abonnement beendet" email
- Clear `pending_plan` and `renewal_reminder_sent`

**Path B — Non-cancelled, within grace period** (`pending_plan IS NULL` AND `current_period_end < now` AND `current_period_end + 7 days > now` AND `renewal_reminder_sent = false`):
- Do NOT downgrade yet
- Generate a Payrexx checkout URL via `create-payrexx-gateway` invocation (passing `referenceId = {userId}-{planType}-{timestamp}` so webhook can identify the subscription)
- Send "Verlängerung erforderlich" email with direct payment link
- Set `renewal_reminder_sent = true`

**Path C — Non-cancelled, grace period expired** (`pending_plan IS NULL` AND `current_period_end + 7 days < now`):
- Downgrade to free
- Send "Abonnement abgelaufen" email
- Reset `renewal_reminder_sent = false`

**7-day warning emails** (existing logic, refined):
- If `pending_plan = 'free'`: "Ihr Abo endet am X, danach kostenloser Plan"
- If `pending_plan IS NULL`: "Ihr Abo wird am X verlängert. Bitte erneuern Sie rechtzeitig." with checkout link

### 3. Update `payrexx-webhook` to reset renewal flag

**File: `supabase/functions/payrexx-webhook/index.ts`**

In the `status === 'confirmed'` block, add to the upsert:
```
renewal_reminder_sent: false,
payment_reminder_1_sent: false,
payment_reminder_2_sent: false,
```

### 4. Grace period banner in HandwerkerDashboard

**File: `src/pages/HandwerkerDashboard.tsx`**

Add a warning banner when the user's subscription `current_period_end < now` AND `plan_type !== 'free'` (meaning they're in the grace period):

> "Ihre Abonnement-Verlängerung steht aus. Bitte schliessen Sie die Zahlung innerhalb von X Tagen ab, um den Zugang zu behalten."

With a "Jetzt erneuern" button linking to `/checkout`.

## Summary

| File | Change |
|------|--------|
| Migration SQL | Add `renewal_reminder_sent` column + index |
| `check-subscription-expiry/index.ts` | Three-path logic: cancelled→downgrade, grace→email+wait, grace expired→downgrade |
| `payrexx-webhook/index.ts` | Reset `renewal_reminder_sent` on confirmed payment |
| `HandwerkerDashboard.tsx` | Grace period warning banner |

Deploy: `check-subscription-expiry` and `payrexx-webhook` edge functions.

