

# Revised Production Readiness Plan v3

Incorporates all QA round 2 feedback with verified findings from live database.

---

## Verified Claims

| Claim | Status | Evidence |
|-------|--------|----------|
| UNIQUE(user_id) on handwerker_subscriptions | **Confirmed** | Constraint `handwerker_subscriptions_user_id_key` exists |
| UNIQUE on payment_history.payrexx_transaction_id | **Missing** | No unique constraints on payment_history |
| Broken quota reset cron | **Confirmed** | Cron job #2 targets `public.subscriptions` (non-existent table) |
| Affected handwerkers with stuck quotas | **None currently** | 0 free-tier users at or above their limit; `can_submit_proposal` RPC resets quotas on-the-fly using a rolling 30-day window, so the broken cron is actually dead code -- the RPC handles resets |
| cleanup-pending-uploads edge function | **Does not exist** | No function directory found; cron #3 is orphaned |
| Existing document URLs in DB | **No data** | `handwerker_documents` table is empty -- no migration of existing URLs needed |
| ReviewsManagement N+1 pattern | **Confirmed** | Lines 60-90: `Promise.all` with individual queries per review for profiles, handwerker_profiles, leads |
| Audit log already implemented | **Confirmed** | ViewModeContext.tsx lines 87-98 insert into admin_audit_log on view switch |

---

## Key Corrections to Previous Plan

### 1. Broken Cron is Dead Code, Not a Billing Bug
The `can_submit_proposal` RPC (the actual enforcement point) uses a rolling 30-day window with on-the-fly reset logic. It checks `current_period_end`, and if expired, resets `proposals_used_this_period` to 0 and extends the period by 30 days. The cron job targeting `public.subscriptions` (wrong table, wrong columns) has never fired successfully -- but it doesn't matter because the RPC handles resets autonomously. **Action**: Remove the broken cron. No data correction needed.

### 2. No Document URL Migration Needed
The `handwerker_documents` table is currently empty (no rows). Making the bucket private requires no retroactive URL conversion. The code changes to store relative paths and use signed URLs only affect future uploads.

### 3. isMounted Guard is Unnecessary
ReviewsManagement uses raw `useState` + `async` in `loadReviews`, but React 18 no longer warns on unmounted state updates. The real fix is the N+1 query pattern (batch-fetch), not an isMounted guard. The fix should use `.in('id', [...ids])` for profiles, handwerker_profiles, and leads.

### 4. Audit Log Scope Clarification
The current implementation logs view mode switches with `from`/`to` in the `details` JSONB. The QA feedback is valid that logging *actions during impersonation* would be more valuable for compliance. However, this is a significant scope expansion (intercepting all data access during impersonation) that belongs post-launch. The current switch-level logging is sufficient for launch.

---

## Updated Execution Plan

### Phase 1: Security-Critical

**1.1 Stripe Secret Revocation** (Manual -- user action)
- Revoke keys at Stripe Dashboard
- Remove `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` from Supabase secrets

**1.2 Private Bucket + Signed URLs**
- SQL migration: set `handwerker-documents` bucket to private (already done in previous implementation)
- Code: store relative paths on upload, use `createSignedUrl()` on display (already done)
- No existing data migration needed (table is empty)
- **Status: COMPLETED**

**1.3 Payrexx Webhook Idempotency**
- SQL migration: add UNIQUE constraint on `payment_history.payrexx_transaction_id` (WHERE NOT NULL)
- Edge function: use `INSERT ... ON CONFLICT (payrexx_transaction_id) DO NOTHING` instead of plain insert, and check returned rows to determine if it was a duplicate
- Add early-exit check before processing (already implemented in previous round)
- **Remaining**: Add the DB constraint + switch insert to ON CONFLICT pattern

### Phase 2: Operational Cleanup

**2.1 Fix Cron Jobs** (SQL via Supabase SQL Editor -- not migration)
- **Remove** broken `reset-monthly-proposal-quotas` (job #2) -- dead code, RPC handles resets
- **Remove** orphaned `cleanup-pending-uploads-daily` (job #3) -- edge function doesn't exist
- **Register** missing crons:
  - `lead-expiry-check`: daily at 08:00 UTC (calls existing edge function)
  - `document-expiry-reminder`: daily at 09:00 UTC (calls existing edge function)
  - `send-rating-reminder`: daily at 10:00 UTC (calls existing edge function)

**2.2 Email Template Interpolation Safety**
- Add `safe()` helper to `emailTemplates.ts` (already done in previous implementation)
- **Status: COMPLETED**

**2.3 Admin Audit Logging**
- Table and basic switch logging already implemented
- Post-launch: expand to log actions during impersonation
- **Status: COMPLETED (launch-sufficient)**

### Phase 3: Code Quality

**3.1 ReviewsManagement N+1 Fix**
- Collect all unique `reviewer_id`, `reviewed_id`, `lead_id` from the reviews array
- Batch-fetch profiles via `.in('id', [...reviewerIds])`
- Batch-fetch handwerker_profiles via `.in('user_id', [...reviewedIds])`
- Batch-fetch leads via `.in('id', [...leadIds])`
- Map results back to reviews
- No isMounted guard needed (React 18)
- **File**: `src/pages/admin/ReviewsManagement.tsx` lines 50-103

**3.2 Toast Standardization**
- Migrate remaining Sonner usage to Radix useToast
- **Status: COMPLETED** (done in previous implementation for GTMConfiguration, DeletionAudit, BulkMetaManager)

**3.3 Console.log Cleanup**
- **Status: COMPLETED** (done in previous implementation for Auth.tsx, ReceivedProposals.tsx)

### Phase 4: Post-Launch (Documented)

- HandwerkerDashboard decomposition (1963-line monolith)
- Edge function rate limiting (especially `guest-user-auto-create`)
- Edge function error handling strategy (partial state updates, dead letter handling)
- Expanded audit logging for actions during impersonation
- Backup/DR documentation (verify PITR is enabled on Supabase plan)
- Secrets rotation tracking

---

## Remaining Work Summary

| # | Item | Type | Status |
|---|------|------|--------|
| 1 | Revoke Stripe keys | Manual (user) | Pending -- user action |
| 2 | Private bucket + signed URLs | Migration + code | **Done** |
| 3 | Payrexx idempotency (UNIQUE constraint) | Migration | **Needs DB constraint** |
| 4 | Email template safety | Edge function | **Done** |
| 5 | Remove broken crons + register missing ones | SQL (manual) | **Pending** |
| 6 | Admin audit logging | Migration + code | **Done** |
| 7 | Toast standardization | Code | **Done** |
| 8 | Console.log cleanup | Code | **Done** |
| 9 | ReviewsManagement N+1 fix | Code | **Pending** |

**Items requiring implementation: #3 (DB constraint), #5 (cron SQL), #9 (N+1 fix)**

---

## Technical Details

### Cron SQL (to run in SQL Editor, not migration)

```text
-- Remove broken/orphaned crons
SELECT cron.unschedule(2);
SELECT cron.unschedule(3);

-- Register missing crons
SELECT cron.schedule('lead-expiry-check', '0 8 * * *', $$
  SELECT net.http_post(
    url := 'https://ztthhdlhuhtwaaennfia.supabase.co/functions/v1/lead-expiry-check',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer <anon_key>"}'::jsonb,
    body := '{}'::jsonb
  );
$$);

SELECT cron.schedule('document-expiry-reminder', '0 9 * * *', $$
  SELECT net.http_post(
    url := 'https://ztthhdlhuhtwaaennfia.supabase.co/functions/v1/document-expiry-reminder',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer <anon_key>"}'::jsonb,
    body := '{}'::jsonb
  );
$$);

SELECT cron.schedule('send-rating-reminder', '0 10 * * *', $$
  SELECT net.http_post(
    url := 'https://ztthhdlhuhtwaaennfia.supabase.co/functions/v1/send-rating-reminder',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer <anon_key>"}'::jsonb,
    body := '{}'::jsonb
  );
$$);
```

### Payment History UNIQUE Constraint (migration)

```text
ALTER TABLE payment_history
ADD CONSTRAINT payment_history_payrexx_transaction_id_unique
UNIQUE (payrexx_transaction_id);
```

### ReviewsManagement Batch-Fetch Pattern

Replace `Promise.all` with individual queries (lines 60-90) with:
1. Collect IDs: `reviewerIds`, `reviewedIds`, `leadIds`
2. Three batch queries using `.in()`
3. Build lookup maps, then enrich reviews in a single loop

