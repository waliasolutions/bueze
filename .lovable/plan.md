## Problem

Payrexx webhook calls are returning **401 "Missing webhook signature"**. The transaction #36467844 log confirms it: Payrexx's webhook payload contains **no `ApiSignature` field**. Our `payrexx-webhook` function currently rejects any request without that field.

This is by design on Payrexx's side — their standard "Normal (PHP-Post)" webhooks do **not** sign the form body. The HMAC `ApiSignature` field is used only on outbound API calls *to* Payrexx, not on incoming webhooks. So our verification logic can never succeed with a real Payrexx webhook.

Result: every real payment webhook is rejected → subscriptions never activate, payment_history never written, invoice never generated. The user (amit.walia@gmx.ch, plan `monthly`, CHF 90.00) paid but their account was not upgraded.

## Fix Strategy

Replace the (impossible) form-body HMAC check with a **server-side verification**: when a webhook arrives, call Payrexx's API to re-fetch the transaction by `transaction[id]` and confirm the status/amount/referenceId match what the webhook claimed. This is the authentication pattern Payrexx itself recommends — anyone can POST a fake body, but only Payrexx will return a matching transaction record when queried with our API secret.

### Plan

1. **`supabase/functions/payrexx-webhook/index.ts`**
   - Remove the `ApiSignature` extraction + HMAC reconstruction + 401 reject block.
   - After parsing `transactionData`, add a verification step:
     - Call `GET https://api.payrexx.com/v1.0/Transaction/{id}/?instance={instance}&ApiSignature={hmac}` using the shared `generateSignature()` from `_shared/payrexxCrypto.ts`.
     - Read `PAYREXX_INSTANCE` env (already used by `create-payrexx-gateway`); fall back via `normalizePayrexxInstance`.
     - Compare returned `status`, `amount`, `referenceId` against the webhook body. If any mismatch → log to `admin_notifications` (`type: 'webhook_error'`) and return 200 with `error: 'verification_failed'` (200 to stop Payrexx retries on tamper attempts; admin still sees it).
     - If the API call itself fails (network/auth) → log and return 200 with `error: 'verification_unreachable'` so Payrexx retries.
   - Keep all existing downstream logic (idempotent payment insert, subscription upsert, invoice trigger, notifications).

2. **No DB / config / frontend changes.** `verify_jwt = false` stays, secrets stay, URL stays.

3. **Backfill the missed transaction** after the fix is deployed:
   - Manually replay transaction #36467844 by either (a) asking Payrexx to re-send the webhook from their dashboard, or (b) running a one-off SQL via migration that inserts the `payment_history` row + upserts `handwerker_subscriptions` for user `4d5b0b6e-7df0-4f08-b986-48f9655364c3` with plan `monthly`. I'll do (a) first; (b) only if Payrexx replay isn't available.

### Verification Steps

After deploy:
1. Trigger a new TEST payment in Payrexx → watch `payrexx-webhook` logs for `Webhook verified ✓`.
2. Confirm `payment_history` row created and `handwerker_subscriptions.plan_type` updated.
3. Replay #36467844 from Payrexx dashboard → confirm amit.walia's subscription activates.

### Technical Notes

- Payrexx's outbound webhook authenticity is verified by **re-querying their API**, not by signature on the body. Their docs explicitly call this out as the recommended pattern for the legacy form-post webhook format.
- We already have `PAYREXX_API_KEY` and `PAYREXX_INSTANCE` secrets and a working `generateSignature()` helper from the gateway-creation function — pure reuse, no new deps.
- Returning 200 (not 4xx) on a verification mismatch prevents Payrexx from retrying a forged request indefinitely while still surfacing it via `admin_notifications`.
