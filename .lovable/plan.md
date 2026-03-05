

# Updated Plan: Payment Architecture — 6 Hardening Changes

Feedback incorporated: realtime publication migration added, cleanup on unmount specified, price migration documented with timestamped TODO pattern.

---

## Issue 1: Race condition — Realtime subscription (HIGH)

**Problem**: User lands on `/profile?tab=subscription&success=true` before webhook fires. Sees "free tier."

**Migration needed**: `handwerker_subscriptions` is NOT in the `supabase_realtime` publication (only `handwerker_notifications` is). Add migration:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE handwerker_subscriptions;
```

**Fix in `src/pages/Profile.tsx`**:
- When `success=true` is detected, show a "Zahlung wird verarbeitet..." banner with spinner
- Subscribe to realtime changes on `handwerker_subscriptions` filtered by `user_id`
- When `plan_type` changes from `free` to paid, dismiss banner, show success toast, refetch subscription data
- 30-second timeout: if no update, show "Bitte laden Sie die Seite in einigen Sekunden erneut"
- **Cleanup**: unsubscribe both on timeout AND on component unmount (return cleanup function from useEffect). This prevents leaked subscriptions if the user navigates away before 30 seconds.

**Files**: `src/pages/Profile.tsx`, migration SQL

---

## Issue 2: referenceId delimiter (HIGH)

**Problem**: `{userId}-{planType}-{timestamp}` uses hyphens — fragile with UUIDs.

**Fix**: Change delimiter to `|`:
- `create-payrexx-gateway`: `${userId}|${planType}|${Date.now()}`
- `payrexx-webhook`: `parseReferenceId` splits on `|`

**Files**: `supabase/functions/create-payrexx-gateway/index.ts`, `supabase/functions/payrexx-webhook/index.ts`

---

## Issue 4: Webhook idempotency ordering (MEDIUM)

**Problem**: `payment_history` insert happens AFTER subscription upsert. Two rapid webhook calls can both pass the idempotency check.

**Fix**: Insert into `payment_history` FIRST using upsert with `onConflict: 'payrexx_transaction_id'` and `ignoreDuplicates: true`. Use `.select('id')` to check if a row was returned. If no rows returned → conflict fired → already processed → bail. Remove the earlier `maybeSingle()` check.

```typescript
const { data: insertedPayment } = await supabase
  .from('payment_history')
  .upsert({
    user_id: userId,
    amount,
    currency: 'CHF',
    plan_type: planType,
    status: 'paid',
    payment_provider: 'payrexx',
    payrexx_transaction_id: transactionId.toString(),
    payment_date: now.toISOString(),
    description: `Büeze ${planType} Abonnement`,
    invoice_pdf_url: invoice?.paymentLink || null,
  }, { onConflict: 'payrexx_transaction_id', ignoreDuplicates: true })
  .select('id');

if (!insertedPayment || insertedPayment.length === 0) {
  console.log(`Transaction ${transactionId} already processed (conflict), skipping`);
  return successResponse({ received: true, already_processed: true });
}
// NOW proceed with subscription upsert
```

**File**: `supabase/functions/payrexx-webhook/index.ts`

---

## Issue 5: Amount validation — allowlist (MEDIUM)

**Problem**: Exact match rejects valid payments after price changes. Accept-all opens tampering risk.

**Fix**: Add `VALID_PLAN_AMOUNTS` to `planLabels.ts`:

```typescript
// When changing prices, add the old price here temporarily.
// TODO: remove old price after YYYY-MM-DD (add date when migrating)
export const VALID_PLAN_AMOUNTS: Record<string, number[]> = {
  monthly: [9000],
  '6_month': [51000],
  annual: [96000],
};
```

In webhook, validate against the array instead of exact match. Document the migration process in the architecture doc: "When changing prices: (1) add new price to VALID_PLAN_AMOUNTS, (2) keep old price with a `// TODO: remove after YYYY-MM-DD` comment, (3) update PLAN_AMOUNTS to new price, (4) remove old price after 48 hours."

**Files**: `supabase/functions/_shared/planLabels.ts`, `supabase/functions/payrexx-webhook/index.ts`

---

## Issue 6: Remove auto-heal + Checkout error UX (HIGH)

**Problem**: Invalid credentials in production trigger simulation mode, redirecting users to success without payment.

**Fix in `create-payrexx-gateway`**:
- Remove the `isAuthError` auto-heal branch entirely. Only simulate when `PAYREXX_TEST_MODE` is explicitly `true`.
- When credentials fail and test mode is off, return 502 with clear error message.

**Fix in `Checkout.tsx`**:
- Detect 502 status in the catch block and show: "Das Zahlungssystem ist momentan nicht verfügbar. Bitte versuchen Sie es später erneut oder kontaktieren Sie den Support."

**Files**: `supabase/functions/create-payrexx-gateway/index.ts`, `src/pages/Checkout.tsx`

---

## Issues 3 & 7: Confirmed — No code changes

- **Issue 3** (grace period / manual renewal): Intentional per AGB.
- **Issue 7** (cancellation): Exists via "Abo kündigen" → `pending_plan='free'` → cron downgrade.

---

## Summary

| # | Issue | Severity | Files |
|---|-------|----------|-------|
| 1 | Race condition → realtime | HIGH | `Profile.tsx`, migration |
| 2 | referenceId delimiter → `\|` | HIGH | `create-payrexx-gateway`, `payrexx-webhook` |
| 4 | Idempotency → insert-first | MEDIUM | `payrexx-webhook` |
| 5 | Amount → allowlist + TODO pattern | MEDIUM | `planLabels.ts`, `payrexx-webhook` |
| 6 | Remove auto-heal + 502 UX | HIGH | `create-payrexx-gateway`, `Checkout.tsx` |

**Total**: 5 files + 1 migration across frontend and edge functions.

