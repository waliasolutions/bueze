

# Security Remediation Plan — Final Revision

All reviewer feedback incorporated. No open blockers.

---

## #7 — Cron Breakage: RESOLVED (No Blocker)

**Finding:** `find-orphaned-records` has NO cron job. The file comment ("Run via Supabase cron: daily at 3 AM") is aspirational — no `pg_cron` schedule exists in any migration. The function is only called from the admin UI (`OrphanedRecordsCleanup.tsx`) which already passes a JWT bearer token via `session.access_token`. Adding the auth check will work immediately with zero breakage.

The misleading comment will be removed during implementation.

---

## Changes (final, all issues resolved)

### 1. `.gitignore` + `.env.example`
Add `.env*` / `!.env.example` to `.gitignore`. Create `.env.example` with placeholder vars.

### 2. `send-password-reset/index.ts` (single edit pass)
- Replace `auth.admin.listUsers()` with `profiles` table lookup by email (column confirmed)
- Replace raw error response with `errorResponse()` helper
- Post-deploy: manual test with real + non-existent email

### 3. `delete-user/index.ts` — FK nullification
Three soft-warn nullify steps placed logically **before the profile delete step** (not line-410):
- `handwerker_approval_history.admin_id → NULL`
- `leads.delivered_by → NULL`
- `handwerker_profiles.verified_by → NULL`

Error logging added to all existing delete steps.

### 4. `delete-user/index.ts` — Recursive storage cleanup
`listAllFiles` helper defined at module scope (outside the `serve()` handler) to avoid hoisting issues. Applied to buckets: `handwerker-documents`, `invoices`, `handwerker-portfolio`. Soft-warn on errors.

### 5. Migration: `ON DELETE CASCADE` on `invoices.user_id`
```sql
ALTER TABLE public.invoices
  DROP CONSTRAINT IF EXISTS invoices_user_id_fkey,
  ADD CONSTRAINT invoices_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
```

### 6. `payrexx-webhook/index.ts` — Reject unsigned requests
Hard-reject if API key missing or signature absent.

### 7. `find-orphaned-records/index.ts` — Add auth check
Copy the existing JWT + admin role-check pattern from `cleanup-orphaned-records`. Remove the stale "cron" comment. No cron job exists — only the admin UI calls this function, already passing a JWT.

---

## Summary

| # | What | File(s) |
|---|------|---------|
| 1 | .gitignore + .env.example | `.gitignore`, `.env.example` (new) |
| 2 | send-password-reset rewrite | `send-password-reset/index.ts` |
| 3 | delete-user FK nullification + error logging | `delete-user/index.ts` |
| 4 | delete-user recursive storage cleanup | `delete-user/index.ts` (same) |
| 5 | invoices FK cascade | New migration |
| 6 | Payrexx webhook reject unsigned | `payrexx-webhook/index.ts` |
| 7 | find-orphaned-records auth check | `find-orphaned-records/index.ts` |

**Files changed: 5 · New files: 1 · New migration: 1 · Deferred: 3 (CORS, CSP, pagination)**

