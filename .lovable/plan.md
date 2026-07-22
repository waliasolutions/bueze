
# Deep QA + Cleanup Plan (v3 — 24h age gate added)

## 1) Health snapshot (verified)

- Data integrity clean: 0 orphans, 0 expired-active leads, 0 profiles without roles.
- Purge candidates: `password_reset_tokens` expired **81** · `admin_notifications` >90 d **258** · `handwerker_notifications` >90 d **5** · `client_notifications` >90 d **8**.
- Storage: `handwerker-portfolio` **1.1 GB / 875 objects** (main sweep target); `lead-media` secondary.
- Cron: 8 jobs active; missing retention + storage sweep.
- Slow queries confirm 4 missing indexes (see §4).
- Linter: **70 WARN / 0 ERROR** (60 SECURITY DEFINER + 3 public-bucket-listing + auth toggles).

## 2) Workflow smoke-test matrix

Playwright: 11 flows (guest→lead, login intercept, handwerker guard, proposals, acceptance RPC, contact reveal, messaging + realtime, Payrexx happy + webhook-drop, custom password reset, admin ops, public routes at 375/1280 px). Screenshots to `/mnt/documents/deep-qa/`.

## 3) Cleanup

**A. One-off purge (`insert` tool):**
```sql
DELETE FROM password_reset_tokens     WHERE expires_at < now();
DELETE FROM admin_notifications       WHERE read=true AND created_at < now()-interval '90 days';
DELETE FROM handwerker_notifications  WHERE read=true AND created_at < now()-interval '90 days';
DELETE FROM client_notifications      WHERE read=true AND created_at < now()-interval '90 days';
```

**B. Automated retention (SSOT):** `public.run_retention_cleanup()` wraps the four purges + existing `delete_expired_magic_tokens()` + `delete_expired_contact_requests()`. Cron `retention-cleanup-daily` at `15 2 * * *` Europe/Zurich.

**C. Storage orphan sweep — safety-first pipeline**

Deletion pipeline for every candidate object in `handwerker-portfolio` and `lead-media`:

```
Storage object
   │
   ▼
[1] Age gate: object.created_at older than 24h?
      NO  → skip (active draft / in-progress upload)
      YES → continue
   │
   ▼
[2] DB reference check: does the normalized key appear in
      handwerker_profiles.portfolio_urls / gallery_urls   (portfolio bucket)
      leads.media_urls                                    (lead-media bucket)
      lead_proposals.attachment_url                       (proposals/ prefix in lead-media)
      YES → keep (referenced)
      NO  → orphan candidate
   │
   ▼
[3] Mode gate:
      dry-run (default) → write to report only, no deletion
      delete            → remove object + audit row
```

Implementation details:
- Extend `supabase/functions/cleanup-orphaned-records/index.ts` with `mode: 'dry-run' | 'delete'` (default `dry-run`) and `min_age_hours` (default `24`).
- Pull each bucket via `storage.from(bucket).list('', { limit: 1000 })` recursively; filter with `Date.now() - new Date(obj.created_at).getTime() >= min_age_hours*3600_000`.
- **URL normalization SSOT** (`normalizeStorageKey`): strip `https://<ref>.supabase.co/storage/v1/object/(public|sign)/<bucket>/`, `decodeURIComponent`, lowercase → compare on relative key only, so absolute CDN URLs and relative storage paths match.
- Report: candidates + normalized keys → `admin_notifications` + function response. Human reviews before running `mode: 'delete'`.
- Cron `orphan-storage-weekly` (`0 3 * * 0` Europe/Zurich) starts in `dry-run` forever; deletion runs stay manual/admin-invoked.

## 4) Latency — single migration

```sql
CREATE INDEX IF NOT EXISTS idx_leads_status_created_at
  ON public.leads (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_handwerker_profiles_created_at
  ON public.handwerker_profiles (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_handwerker_profiles_verification_created
  ON public.handwerker_profiles (verification_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_roles_role
  ON public.user_roles (role);
```
Re-check `slow_queries`; add `.select('col,…').limit()` where callers pull full rows.

## 5) Security hardening — trigger-safe

**Rule:** blanket `REVOKE EXECUTE FROM authenticated` on `SECURITY DEFINER` functions breaks triggers (the row-modifier's role must execute the trigger function). Classify first:

```sql
SELECT p.proname,
       EXISTS (SELECT 1 FROM pg_trigger t
                WHERE t.tgfoid = p.oid AND NOT t.tgisinternal) AS is_trigger
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname='public';
```

- **Bucket A — Triggers (keep EXECUTE):** `handle_new_user`, `notify_admins_of_*`, `trigger_send_*`, `update_updated_at_column`, `update_conversation_timestamp`, `update_handwerker_search_text`, `validate_handwerker_data`, `validate_lead_media`, `sync_lead_proposals_count`, `prevent_handwerker_lead_creation`, `prevent_subscription_self_escalation`, `increment_proposal_count`, `increment_lead_purchased_count`. `handle_new_user` explicitly kept callable for the Supabase auth signup path.
- **Bucket B — Cron/service-only utilities (REVOKE from anon+authenticated, keep service_role):** `check_lead_expiry`, `delete_expired_magic_tokens`, `delete_expired_contact_requests`, `generate_invoice_number`, `setup_admin_user`, `admin_activate_subscription`.
- **Bucket C — UI RPCs (REVOKE from anon, GRANT to authenticated):** `has_role`, `get_user_role`, `handwerker_can_view_client_profile`, `get_accepted_client_contacts`, `handwerker_has_proposal_on_lead`, `can_submit_proposal`, `accept_proposal_atomic`, `budget_ranges_overlap`, `get_users_with_roles`.

**Validation gate:** in a `BEGIN … ROLLBACK` block, exercise signup, lead insert (client), proposal insert. Any `permission denied for function` → rollback and reclassify.

**Storage bucket policies:** tighten read on `lead-media` + `handwerker-portfolio` to owner-only or explicit public-read predicate. `sitemaps` stays public.

**Dashboard toggles (out-of-band):** OTP expiry, leaked-password protection, Postgres patch — linked in final report.

## 6) Dead code sweep

- Remove unused `SUBMIT_LEAD_DRAFT` key in `src/lib/localStorageVersioning.ts`.
- Audit `check-admin-role`, `reset-test-data`, `populate-test-data` edge functions — keep behind admin auth or delete.
- Flag zero-scan indexes only (no drops this round).

## 7) Execution order

1. Migration #1: indexes (§4).
2. Migration #2: security hardening (§5), split per bucket, gated by classification query + validation gate.
3. Migration #3: `run_retention_cleanup()`.
4. `insert` tool: §3A purge + `cron.schedule` for `retention-cleanup-daily` and `orphan-storage-weekly` (dry-run).
5. Edge-function edit: `cleanup-orphaned-records` gains `mode`, `min_age_hours=24`, normalization SSOT, storage sweep.
6. Code cleanup: remove `SUBMIT_LEAD_DRAFT`.
7. Playwright smoke-test matrix.
8. Final report: slow-query deltas, purge counts, dry-run storage candidates for review, dashboard toggle links.

## Not doing (YAGNI)

- No auto-delete of storage orphans on first run.
- No blanket revoke on trigger functions.
- No unused-index drops.
- No policy rewrites beyond storage buckets.
