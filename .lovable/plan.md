
## Deep QA findings — Payrexx recovery pipeline

Current state was verified against the live DB and code. Gabor's account itself is correct (`plan_type=monthly`, `proposals_limit=-1`, period 2026-07-16 → 2026-08-16, notification sent, confirmation email delivered). However three real defects were found — one critical.

### 🔴 CRITICAL — `admin_activate_subscription` will always fail on invocation

The RPC we just shipped as the "safety helper so this never happens again" writes to columns that don't exist:

- Function INSERTs `admin_audit_log(admin_id, action, target_id, details)`.
- Real columns on `public.admin_audit_log` are: `id, admin_user_id, action, details, ip_address, created_at`.

Because the audit INSERT happens inside the same transaction as the subscription upsert, Postgres raises `column "admin_id" does not exist` and the entire activation rolls back. Gabor's account is only active because the manual UPDATE we ran earlier bypassed this function; the helper itself has never actually succeeded.

**Fix:** migration that recreates `admin_activate_subscription` with the correct column names (`admin_user_id`) and drops the non-existent `target_id`, folding the target user id into the `details` JSONB instead.

### 🟡 Gabor has no invoice (Quittung) for his CHF 90 payment

`payment_history` has the paid row, but `invoices` is empty for `d95042d1-…`. The manual recovery migration never invoked `generate-invoice-pdf`, so the user cannot download a Quittung from his dashboard even though he paid.

**Fix (one-time data repair, not a migration):** invoke `generate-invoice-pdf` for `payment_history.id = 539ef630-a573-4afa-9333-6271574ede4d`. Verify a row lands in `invoices` and PDF storage path is populated.

**Fix (systemic):** update `admin_activate_subscription` to also insert the `payment_history` row (idempotently, matching `payrexxActivation.ts` semantics) and trigger `generate-invoice-pdf` + `send-subscription-confirmation` after the sub is verified active. Today the helper only touches `handwerker_subscriptions`, so any future manual recovery repeats the same "sub active but no invoice / no email" gap unless the operator remembers to run three separate steps.

### 🟡 `verify-payrexx-payment` missing from `supabase/config.toml`; `reconcile-payrexx-payments` referenced but never created

- `verify-payrexx-payment` is not declared in `config.toml`. It works today because Lovable defaults to `verify_jwt=false` and the function does its own JWT check, but the sibling Payrexx functions (`payrexx-webhook`, `cancel-payrexx-subscription`, `create-payrexx-gateway`) are all explicitly declared. Add an explicit `[functions.verify-payrexx-payment] verify_jwt = false` block for consistency and to prevent future default drift.
- The shared header in `_shared/payrexxActivation.ts` documents a `reconcile-payrexx-payments` scheduled safety-net as the third pillar. It doesn't exist. Either remove the misleading comment or (preferred) create the tiny scheduled function that scans `payment_history` gaps once/day — this is the real "webhook + verify + reconcile" defense-in-depth we told the user we had.

### ✅ Verified correct

- Gabor's subscription row, notification, confirmation email content and delivery.
- Webhook + verify use the shared `activateFromConfirmedTransaction` SSOT (DRY preserved).
- Idempotency: `payment_history.payrexx_transaction_id` unique guard is enforced.
- `prevent_subscription_self_escalation` correctly blocks client-side upgrades; service role (webhook/verify) bypasses as designed.

## Plan of action

1. **Migration** — rewrite `admin_activate_subscription` with correct `admin_audit_log` columns, and extend it to insert `payment_history` + call `send-subscription-confirmation` + `generate-invoice-pdf` (best-effort, non-blocking, mirroring `payrexxActivation.ts`) so a single admin call reaches the exact same end-state as the automatic pipeline.
2. **One-time data repair** — call `generate-invoice-pdf` for Gabor's existing `payment_history` row so his Quittung appears in the dashboard.
3. **Config hygiene** — add `[functions.verify-payrexx-payment] verify_jwt = false` to `supabase/config.toml`.
4. **Docs vs. reality** — either delete the `reconcile-payrexx-payments` mention from `_shared/payrexxActivation.ts` or scaffold the scheduled function (recommend scaffold; ~40 LOC, reuses the SSOT).
5. **Post-verify** — re-call `admin_activate_subscription` in a dry-run (dev user or noop-safe path) to confirm it now succeeds end-to-end; confirm Gabor's invoice row exists.

### Technical details

- No frontend changes required.
- No RLS changes required.
- Migration is idempotent (`CREATE OR REPLACE FUNCTION`); ordering after last structural change follows the standard UTC timestamp convention.
- Reconcile function (if scaffolded) runs daily via `pg_cron`, queries confirmed Payrexx transactions from the last 24h, and calls `activateFromConfirmedTransaction` for any missing `payment_history.payrexx_transaction_id`.
