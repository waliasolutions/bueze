# Deep QA Audit Plan

Goal: verify the whole app loads and works correctly, and surface any saving / performance issues — without changing behavior until findings are triaged.

## Scope

Read-only audit across four layers. No code changes in this pass; fixes are proposed in a follow-up plan after findings are reviewed.

## 1. Runtime health (browser)

- Drive Playwright against `localhost:8080` for the key journeys:
  - Public: `/`, `/kategorien`, `/kategorien/:major`, `/handwerker-verzeichnis`, `/pricing`, `/impressum`, `/datenschutz`, `/legal/agb`.
  - Client: `/auth` → `/submit-lead` (3-step) → `/dashboard` → `/lead/:id` → `/conversations`.
  - Handwerker: `/auth` → `/handwerker-dashboard` → `/search` → `/opportunity/:id` → `/proposals` → `/handwerker-invoices`.
  - Admin: `/admin`, `/admin/handwerkers`, `/admin/leads`, `/admin/invoices`, `/admin/billing`, `/admin/image-backfill`.
- Capture per route: console errors/warnings, failed network requests, LCP screenshot, and any horizontal overflow warnings from `useOverflowDetector`.

## 2. Save-path integrity

Verify each write actually persists and gives correct feedback (post-toast cleanup regression check):
- Profile edit (handwerker + client), document upload/remove, portfolio image upload.
- Lead submit, edit, delete, restore.
- Proposal submit / accept (RPC `accept_proposal_atomic`) / reject.
- Message send (optimistic update + realtime).
- Admin: handwerker edit, invoice status, review visibility, GTM/SEO save.
- Auth: signup, login, password reset (custom token flow), logout cache clear.

## 3. Frontend performance

- Bundle: inspect `dist` after a production build for chunk sizes, oversized vendor chunks, and any route not lazy-loaded that should be.
- Runtime: check for unnecessary re-renders in Dashboard / HandwerkerDashboard / Messages (subscription cleanup, query key stability).
- Realtime: confirm all `supabase.channel(...)` calls are inside `useEffect` with `removeChannel` cleanup (billing rule).
- Images: verify LCP images use `fetchpriority=high`, non-LCP use `loading=lazy`, and the compressor is wired on all upload paths (`SubmitLead`, `HandwerkerProfileEdit`, `HandwerkerOnboarding`, message attachments).
- React Query: audit `staleTime`/`gcTime` per hook and look for missing `enabled` guards causing wasted fetches.

## 4. Backend / DB health

- `supabase--slow_queries` top 20 → EXPLAIN the worst offenders, note missing indexes.
- `supabase--linter` for unused indexes, missing FKs, RLS gaps.
- Check for:
  - Tables missing GRANTs (permission errors in logs).
  - Cron jobs status (`run_retention_cleanup`, `check-subscription-expiry`, `lead-expiry-check`, `document-expiry-reminder`, `proposal-deadline-reminder`, `storage-orphan-sweep`) — last run + failures.
  - Edge function error rate via `ai_gateway_logs` and function logs for the last 7 days.
  - Orphan data: leads without client, proposals without lead, subscriptions without handwerker, `notifications` older than retention.
  - Storage buckets: total size trend, orphan objects report from `storage-orphan-sweep`.

## 5. Deliverable

A single findings report grouped as:
- **Blockers** (broken flow, data loss, security)
- **Saving issues** (writes that silently fail or mislead the user)
- **Performance** (slow queries, oversized bundles, missing indexes, render/realtime leaks)
- **Cleanup** (dead code, stale rows, unused indexes)

Each finding includes: evidence (file:line, query, screenshot, or log id), impact, and a proposed fix. After you review, I open a follow-up plan for the fixes you approve.

## Technical notes

- Audit is fully read-only: Playwright, `supabase--read_query`, `supabase--slow_queries`, `supabase--linter`, `supabase--edge_function_logs`, `ai_gateway_logs--list_ai_gateway_requests`, file reads only.
- No migrations, no code edits, no toast changes in this pass.
- Uses the injected browser Supabase session for authenticated routes; skips flows that need a real Payrexx callback (verified separately via logs).
