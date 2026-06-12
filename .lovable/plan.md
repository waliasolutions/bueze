# Fix: Craftsmen can't see client details after acceptance — RCA + permanent fix

Your analysis is accurate and matches the codebase. Adopting it as the plan with two small adjustments noted at the end.

## Root causes (confirmed)

1. **RC1 — Non-atomic client-side acceptance** in `src/lib/proposalHelpers.ts::acceptProposal` performs 3 sequential writes from the browser. A mid-flight failure leaves `leads.accepted_proposal_id` set while the proposal stays `pending` → both RLS and the dashboard UI (which gate on `status='accepted'`) correctly hide the contact. **This keeps minting new broken records.**
2. **RC2 — Fragile RLS hotfix** on `profiles` inlines a cross-table subquery (`lead_proposals` JOIN `leads`) — same pattern that previously caused `42P17` recursion, fixed elsewhere via `handwerker_has_proposal_on_lead` SECURITY DEFINER. One stray future policy can silently break all profile reads for craftsmen.
3. **RC3 — Silent failure & single fragile read path.** `HandwerkerDashboard.tsx:369-396` swallows RLS errors (`console.error` only), and the SELECT on `profiles` is the only access path.
4. **RC4 (side)** — Double dispatch of `send-acceptance-emails`: DB trigger `on_proposal_accepted` (pg_net) **and** frontend `functions.invoke(...)` both fire; the edge function is not idempotent → duplicate conversations + duplicate emails on every acceptance.

## Fix design

### A. Migration — `supabase/migrations/<ts>_atomic_accept_and_contact_access.sql`

1. `public.accept_proposal_atomic(p_proposal_id uuid) returns jsonb` — `SECURITY DEFINER`, `SET search_path = public`. Verifies `auth.uid() = leads.owner_id`, `SELECT ... FOR UPDATE` on lead + proposal, validates `lead.status='active'` and `proposal.status='pending'`, performs all 3 updates in one transaction, returns `{success, message}` matching today's German strings. `GRANT EXECUTE ... TO authenticated`; `REVOKE ... FROM anon`.
2. `public.get_accepted_client_contacts(p_lead_ids uuid[])` — `SECURITY DEFINER STABLE`, returns `(lead_id, client_id, full_name, email, phone)` for leads where the caller has an accepted proposal. Becomes SSOT for contact access; immune to `profiles` RLS drift. Uses existing `idx_lead_proposals_handwerker_status`.
3. **Harden the hotfix (defense in depth):** `DROP POLICY IF EXISTS "Handwerkers can view accepted client profile" ON public.profiles;` then add SECURITY DEFINER fn `public.handwerker_can_view_client_profile(p_profile_id uuid)` and recreate policy as `USING (public.handwerker_can_view_client_profile(id))` — same recursion-proof pattern as `handwerker_has_proposal_on_lead`.
4. All statements idempotent (`CREATE OR REPLACE`, `DROP ... IF EXISTS`, `CREATE POLICY` after drop).

### B. Repair script — `supabase/repair/2026-06-12-repair-accepted-offers.sql` (manual, not auto-applied)

Single transaction:
1. `ALTER TABLE lead_proposals DISABLE TRIGGER on_proposal_accepted;` (avoid retro email spam).
2. Promote stuck proposals: any proposal referenced by `leads.accepted_proposal_id` with `status<>'accepted'` → `accepted` (set `responded_at` if null).
3. Reverse drift: leads with an accepted proposal but `status<>'completed'` or null `accepted_proposal_id` → fix. Leads with 2+ accepted proposals are **reported via NOTICE and skipped** (no guessing).
4. Reject other still-pending proposals on repaired leads.
5. Backfill missing `conversations` (`WHERE NOT EXISTS` and only when both profile rows exist) and missing `handwerker_notifications` (`type='proposal_accepted'`) — no emails.
6. Re-enable trigger. Emits `RAISE NOTICE` counts. Safe to re-run.

Top of file: SELECT-only diagnostic queries to count broken rows before/after (must be 0 after).

### C. Frontend (minimal, preserves existing patterns)

1. `src/lib/proposalHelpers.ts` — `acceptProposal()` becomes a single `supabase.rpc('accept_proposal_atomic', { p_proposal_id: proposalId })`. **Remove** the frontend `supabase.functions.invoke('send-acceptance-emails', ...)` call — the DB trigger is the sole dispatcher (fixes RC4). Return shape unchanged; `acceptProposalsBatch`, `ReceivedProposals`, `ProposalReview`, `ProposalsManagement` untouched.
2. `src/pages/HandwerkerDashboard.tsx:369-396` — replace the direct `profiles` SELECT with `supabase.rpc('get_accepted_client_contacts', { p_lead_ids })`. Extract pure mapper `mapProposalsToContacts` into `src/lib/proposalQueries.ts` (DRY + testable). On RPC error, surface a toast (match pattern at line 349) instead of swallowing.
3. `src/integrations/supabase/types.ts` — **do not hand-edit** (project rule: file is auto-regenerated after migration approval). After the migration runs, the types regenerate to include both RPCs. Frontend edits land in the same response right after migration approval, when types are fresh.

### D. Tests (vitest)

- `src/lib/proposalHelpers.test.ts` — mocked supabase: success path, RPC error propagation, already-accepted German message, batch behavior, **assert no `functions.invoke` call**.
- `src/lib/proposalQueries.test.ts` — pure `mapProposalsToContacts` unit tests (accepted-only filtering, missing contact tolerance).

## Verification

1. `npx vitest run` — new + existing tests green.
2. Build / typecheck passes (auto by harness).
3. Manual: run repair script's SELECT preamble in Supabase SQL editor → record broken count → apply migration → run repair script → preamble returns 0 → spot-check a craftsman dashboard.

## Adjustments to your draft

- **Do not hand-edit `src/integrations/supabase/types.ts`** — Lovable rule: that file is regenerated from the live DB after migration approval. The RPC signatures will appear automatically; we just call the typed `supabase.rpc(...)` after.
- **Branch/commit/push are not performed by the agent** — Lovable manages git internally. All changes land on the working branch automatically; if you want them on `claude/craftsmen-client-details-qa-lrwx14`, merge from the Lovable working branch on your side.

Everything else in your spec is adopted verbatim.

## Order of execution (build mode)

1. Call `supabase--migration` with the full SQL for section A → wait for your approval.
2. After approval and types regeneration: write the repair script (B), edit `proposalHelpers.ts` + `HandwerkerDashboard.tsx` + new `proposalQueries.ts` (C), add tests (D), run `vitest`.
3. Report results + remind you to run the repair script manually in the Supabase SQL editor.
