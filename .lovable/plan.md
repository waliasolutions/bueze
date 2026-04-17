

# Bulk Password Reset Plan — v4 (Execute-Ready)

All feedback incorporated. Tightened, concrete, reversible.

---

## Pre-flight (already confirmed)

Supabase Auth password policy = min length 8, no complexity. ✅
Path decision: **Set `A12345678` directly** (no must_change_password flag, no notification email). ✅

---

## Step 1 — Hypothesis check (read-only) with hard abort condition

Query 2–3 handwerker accounts where you know a manual password was set successfully. Compare:

```sql
SELECT id, email, created_at, updated_at, last_sign_in_at,
       EXTRACT(EPOCH FROM (updated_at - created_at))::int AS delta_seconds
FROM auth.users
WHERE id = ANY($1::uuid[]);
```

**Decision rule (explicit):**
- ≥1 account has `updated_at > created_at + 5min` → 4 known paths confirmed → **continue**.
- ALL accounts have `updated_at ≤ created_at + 5min` → there's a 5th path that doesn't move `updated_at` → **ABORT**, revisit detection logic before any write operation.

You provide the 2–3 reference user IDs / emails before I run this.

---

## Step 2 — Detection query (exact SQL, no prose)

```sql
SELECT u.id, u.email, u.created_at, u.updated_at, u.last_sign_in_at,
       EXTRACT(EPOCH FROM (u.updated_at - u.created_at))::int AS delta_seconds,
       p.full_name,
       COALESCE(r.role::text, 'user') AS role,
       hp.verification_status AS handwerker_status
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.user_roles r ON r.user_id = u.id
LEFT JOIN public.handwerker_profiles hp ON hp.user_id = u.id
WHERE u.last_sign_in_at IS NULL                                 -- never logged in (primary indicator)
  AND u.updated_at <= u.created_at + interval '5 minutes'       -- and password never changed
  AND u.email_confirmed_at IS NOT NULL
  AND u.banned_until IS NULL
  AND u.deleted_at IS NULL
  AND (r.role IS NULL OR r.role NOT IN ('admin', 'super_admin'))
  AND u.email != 'info@bueeze.ch'
ORDER BY u.created_at DESC;
```

Column names verified against `auth.users` schema before execution. Both indicators (`last_sign_in_at IS NULL` AND `updated_at delta`) shown in the output so you can decide if either alone is enough.

---

## Step 3 — Backup table (rollback safety net)

```sql
CREATE TABLE public.password_reset_backup_2026_04_17 (
  user_id uuid PRIMARY KEY,
  email text NOT NULL,
  old_encrypted_password text NOT NULL,
  old_updated_at timestamptz NOT NULL,
  backed_up_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.password_reset_backup_2026_04_17 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only super_admin can access" ON public.password_reset_backup_2026_04_17
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));
```

**Before** updating each user's password, the edge function snapshots the current `encrypted_password` + `updated_at` here. Rollback is then a manual `UPDATE auth.users SET encrypted_password = b.old_encrypted_password FROM password_reset_backup_2026_04_17 b WHERE auth.users.id = b.user_id` — ugly but possible.

---

## Step 4 — Audit log

Reuse existing `admin_notifications` (or create `admin_actions` if missing). One row per batch run:

```sql
INSERT INTO public.admin_notifications (type, title, message, related_id, metadata)
VALUES ('bulk_password_reset', 'Bulk-Passwort-Reset ausgeführt',
        'X von Y Usern erfolgreich zurückgesetzt',
        <admin_user_id>,
        jsonb_build_object(
          'triggered_by', <admin_user_id>,
          'requested_user_ids', $1,
          'actually_reset_user_ids', $2,
          'skipped_user_ids', $3,
          'failed', $4,
          'backup_table', 'password_reset_backup_2026_04_17',
          'timestamp', now()
        ));
```

Persistent record for "in 3 months a user complains" scenarios.

---

## Step 5 — Constants file

`supabase/functions/_shared/constants.ts` (new):

```typescript
// Synchronized constants - mirror of src/lib/validationHelpers.ts.
// Frontend & edge functions are separate deployments; if you change one, change the other.
export const PASSWORD_MIN_LENGTH = 8;
export const ONBOARDING_GRACE_PERIOD_MINUTES = 5;
```

Honest naming: "synchronized constants", not SSOT. Comment in both files cross-references the other.

---

## Step 6 — UI label fix (Issue 1)

Grep `src/` and `supabase/functions/` for `"6 Zeichen"`, `"min. 6"`, `"minimum 6"`, `length < 6`, `length < 8`. Replace with `PASSWORD_MIN_LENGTH` import. Single number, two import paths, drift-resistant.

---

## Step 7 — Extend `reset-user-password` (single function, three modes)

- **Modes:** `single-auto` (existing), `single-custom` (admin password), `bulk-custom` (`userIds[]` + password).
- **Admin gate:** re-verify JWT + `user_roles.role IN ('admin', 'super_admin')` → 403 otherwise.
- **Concurrency / idempotency safeguard:** in `bulk-custom` mode, function takes `approvedUserIds[]` from client, then **re-runs the detection query at execution time** and computes `actuallyReset = approvedUserIds ∩ stillCandidate`. Users who logged in / changed password between dry-run and execute are automatically dropped and listed in the report.
- **Per-user loop (continue-on-error):**
  1. Snapshot old `encrypted_password` + `updated_at` → `password_reset_backup_2026_04_17`.
  2. `auth.admin.updateUserById(userId, { password })`.
  3. Re-query `auth.users.updated_at` → must move past `created_at`.
  4. Server-side `signInWithPassword({ email, password })` as fresh anon client → must succeed.
  5. Append `{ userId, email, status: 'success'|'failed', error? }` to results.
  6. **One failure does NOT abort the batch.** All 30 attempted, all results returned.
- **Pre-flight policy probe:** before the loop, attempt the update on the first candidate. If it fails with policy error, abort entire batch with clear message, no partial state.
- **Sanitizer:** strip `customPassword` from logs AND from any error responses returned to the client (Supabase sometimes echoes the input password in 400 error bodies).
- **Audit row** written after the loop completes, regardless of partial failures.

---

## Step 8 — Two-phase execution

**Phase A — Dry-run:** I run the Step 2 query and present the candidate table. You approve / strike rows.

**Phase B — Execute:** I invoke `reset-user-password` in `bulk-custom` mode with approved IDs. Returns:
- Per-user verified results table in chat.
- CSV at `/mnt/user-data/outputs/bulk-password-reset-results-2026-04-17.csv`.
- Audit row in `admin_notifications`.
- Backup rows in `password_reset_backup_2026_04_17`.

---

## Files (final scope, shared dialog moved to separate ticket)

| # | File | Change |
|---|------|--------|
| 1 | grep across `src/` + `supabase/functions/` | Replace hard-coded length numbers with `PASSWORD_MIN_LENGTH` import |
| 2 | `supabase/functions/_shared/constants.ts` (new) | `PASSWORD_MIN_LENGTH`, `ONBOARDING_GRACE_PERIOD_MINUTES` |
| 3 | `supabase/functions/reset-user-password/index.ts` | Add `customPassword`, `userIds[]`, re-detection, backup write, sanitizer, audit log |
| 4 | Migration: `password_reset_backup_2026_04_17` table | Backup table with RLS (super_admin only) |
| 5 | Read-only: hypothesis check query (Step 1) | No file change |
| 6 | Read-only: detection query (Step 2) | No file change |
| 7 | One-time invocation after dry-run approval | No file change |

Out-of-scope (separate ticket): Shared `<PasswordResetDialog>` DRY refactor.

**Files changed: 1 · New files: 2 · One-time data action: 1 (after your dry-run approval) · Reversible via backup table**

---

## Gates (consolidated)

1. ✅ Policy confirmed (done).
2. ✅ Path decision: `A12345678` (done).
3. **Pending:** You provide 2–3 reference user IDs/emails for hypothesis check (Step 1).
4. **Pending:** You approve the dry-run candidate list (Step 8 Phase A).

Once you provide the reference accounts, I execute Steps 1 → 2 → present results, then await Gate 4 before any write.

