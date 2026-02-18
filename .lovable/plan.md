

# Revised Production Readiness Remediation Plan

Incorporates all QA feedback. Items resequenced by actual risk severity.

---

## Phase 1: Security-Critical (Immediate)

### 1.1 Revoke Stripe Secrets at Stripe Dashboard
- **Risk**: Active API keys for a decommissioned payment provider are an exploitable security surface
- **Action (Manual, User)**: Log into the Stripe dashboard, revoke the API key and webhook secret, then remove `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` from Supabase Edge Function secrets
- **No code change needed** -- purely operational

### 1.2 Make `handwerker-documents` Storage Bucket Private
- **Risk**: HIGH -- GDPR/DSG relevant. Trade licenses, certifications, and possibly identity documents are publicly accessible via direct URL
- **Current state**: `handwerker-documents` bucket is `public: true`
- **Action**: 
  1. SQL migration to set bucket to private
  2. Update `DocumentManagementSection.tsx`, `useHandwerkerDocuments.ts`, and admin document views to use Supabase signed URLs (via `supabase.storage.from('handwerker-documents').createSignedUrl(path, 3600)`) instead of public URLs
  3. Update document upload flow to store relative paths instead of full public URLs
- **Files affected**: ~4 files (document upload, document display, admin document review)

### 1.3 Payrexx Webhook Idempotency
- **Risk**: HIGH -- If Payrexx retries a webhook (network timeout, 5xx), the same transaction creates duplicate `payment_history` rows. No unique constraint exists on `payrexx_transaction_id`.
- **Action**:
  1. Add UNIQUE constraint on `payment_history.payrexx_transaction_id` (where not null)
  2. Use `ON CONFLICT` in webhook insert to prevent duplicates
  3. Add early-exit check: if transaction already processed, return 200 immediately
- **Files affected**: `supabase/functions/payrexx-webhook/index.ts`, 1 migration

---

## Phase 2: Data Integrity & Compliance

### 2.1 Email Template Interpolation Safety
- **Risk**: MEDIUM -- Any null/undefined field renders as literal "undefined" in customer emails
- **Current state**: 968-line template file with ~30+ direct string interpolations and no fallback guards
- **Action**: Create a `safeInterpolate` helper that defaults to empty string, and wrap all template data accesses. Specific high-risk fields:
  - `data.handwerkerName` -- used in 5 templates
  - `data.clientName` -- used in 6 templates  
  - `data.projectTitle` -- used in 8 templates
  - `data.clientPhone`, `data.clientEmail`, `data.clientAddress` -- contact data in acceptance emails
- **File affected**: `supabase/functions/_shared/emailTemplates.ts`

### 2.2 Missing Cron Jobs
- **Current state**: Only 3 cron jobs are registered:
  1. `proposal-deadline-reminders` (daily 09:00 UTC)
  2. `reset-monthly-proposal-quotas` (1st of month -- targets old `subscriptions` table, NOT `handwerker_subscriptions`)
  3. `cleanup-pending-uploads-daily` (02:00 UTC -- references non-existent edge function)
- **Missing crons**: `lead-expiry-check`, `document-expiry-reminder`, `send-rating-reminder`
- **Broken cron**: `reset-monthly-proposal-quotas` updates `public.subscriptions` which likely doesn't exist (the active table is `handwerker_subscriptions`)
- **Action**: 
  1. Register missing cron jobs via SQL
  2. Fix or remove the broken `reset-monthly-proposal-quotas` job
  3. Remove the orphaned `cleanup-pending-uploads-daily` job

### 2.3 Admin View Mode Audit Logging
- **Risk**: MEDIUM -- DSG/GDPR governance gap. Admins can impersonate client/handwerker views with no record
- **Action**: Add a lightweight `admin_audit_log` table and log view mode switches in `ViewModeContext.tsx`
- **Scope**: 1 migration + 1 file change

---

## Phase 3: Code Quality & Robustness

### 3.1 Standardize Toast System
- **Current state**: Two independent toast systems coexist:
  - Radix toasts via `@/hooks/use-toast` (used in 39 files)
  - Sonner toasts via `sonner` (used in 1 file: `AdminLeadsManagement.tsx`)
- **Action**: Migrate `AdminLeadsManagement.tsx` from `sonner` to Radix `useToast`. This is a 1-file fix since Sonner is only used in one place.
- **Decision**: Keep Radix as the standard (overwhelmingly dominant usage)

### 3.2 Console.log Cleanup
- **Files**: `Auth.tsx` (8 logs), `ReceivedProposals.tsx` (1), `OpportunityView.tsx` (1)
- **Action**: Wrap in `import.meta.env.DEV` guards

### 3.3 ReviewsManagement N+1 Query Fix
- **Action**: Batch-fetch profiles and leads using `.in('id', [...ids])` pattern (already done in the approved plan from earlier)
- **Add `isMounted` guard** to prevent state updates on unmounted component

### 3.4 useUserRole SSOT Migration (17 files)
- **Deferred to post-launch** but documented. Files still querying `user_roles` directly:
  - Dashboard.tsx, HandwerkerDashboard.tsx, all admin pages, ConversationsList.tsx, Messages.tsx, Auth.tsx, etc.

---

## Phase 4: Post-Launch (Documented, Not Blocking)

### 4.1 HandwerkerDashboard Decomposition
- 1963-line monolith -- extract into tab components
- Not a launch blocker (single-user load, not public-facing)

### 4.2 Edge Function Rate Limiting
- `guest-user-auto-create` and other public endpoints need rate limiting
- Requires Supabase-level configuration or middleware in edge functions

### 4.3 Backup & Disaster Recovery Documentation
- Document RTO/RPO targets
- Verify Supabase point-in-time recovery is enabled and window is sufficient
- Not code -- operational documentation

### 4.4 Secrets Rotation Tracking
- Add "Last Rotated" metadata for all secrets
- Operational process, not code

---

## Summary: Execution Sequence

| Priority | Item | Type | Risk |
|----------|------|------|------|
| 1 | Revoke Stripe keys at Stripe dashboard | Manual (user) | Security |
| 2 | Private bucket for handwerker-documents + signed URLs | Migration + code | GDPR/DSG |
| 3 | Payrexx webhook idempotency (unique constraint) | Migration + code | Data integrity |
| 4 | Email template interpolation fallbacks | Edge function | User-facing bug |
| 5 | Fix broken/missing cron jobs | SQL (manual) | Operational |
| 6 | Admin view mode audit logging | Migration + code | Compliance |
| 7 | Standardize toast system (1 file) | Code | UX/Accessibility |
| 8 | Console.log cleanup | Code | Hygiene |
| 9 | ReviewsManagement N+1 fix | Code | Performance |

## What Does NOT Change
- RLS architecture (already solid with SECURITY DEFINER pattern)
- Spam protection stack (already comprehensive)
- Error boundary architecture (already production-grade)
- Subscription unique constraint (already exists: `UNIQUE(user_id)`)
- useSubscription write-on-read: The `UNIQUE(user_id)` constraint already prevents duplicate rows. The concurrent-tab scenario raised in feedback is already handled at the database level.

