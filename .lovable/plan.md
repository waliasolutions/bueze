# Fix: "Fehler beim Laden – Bitte laden Sie die Seite neu" after login

## What is actually happening (confirmed)

The Postgres logs show, at exactly the times of the logins this morning:

```text
ERROR  42P17  infinite recursion detected in policy for relation "leads"
ERROR  42P17  infinite recursion detected in policy for relation "lead_proposals"
```

Cause is a circular pair of RLS policies:

- `leads` SELECT policy contains `EXISTS (SELECT 1 FROM lead_proposals ...)`
- `lead_proposals` SELECT policy contains `lead_id IN (SELECT id FROM leads WHERE owner_id = auth.uid())`

So reading either table makes Postgres evaluate the other one's policy, which evaluates the first again. Every dashboard query touching leads/proposals fails, and the Handwerker dashboard surfaces exactly the toast the user saw. This is not a login problem — the login itself succeeded (auth logs show status 200).

## The fix (SSOT, no new systems)

Break the cycle with SECURITY DEFINER helper functions, which Postgres does not re-check RLS for. One helper already exists and is reused; only the missing counterpart gets added.

1. Reuse the existing `public.handwerker_has_proposal_on_lead(lead_uuid)` in the `leads` SELECT policy instead of the inline `EXISTS ... FROM lead_proposals`.
2. Add `public.is_lead_owner(lead_uuid)` (SECURITY DEFINER, STABLE, `search_path = public`) and use it in the `lead_proposals` SELECT and UPDATE policies instead of the inline `SELECT ... FROM leads`.
3. Recreate the two affected policies in a single migration; no policy semantics change — the same people see the same rows.
4. Grant EXECUTE on the new helper to `authenticated` only (not `anon`), matching the existing hardening rule.

No frontend change is required — the toast is a correct symptom report. The existing recursion-specific toast in `HandwerkerDashboard.tsx` stays as a safety net.

## Verification after the migration

- Re-run the failing reads as the affected Handwerker (leads list + proposals list with the `leads!...` join) and confirm no 42P17.
- Re-check Postgres logs for new `42P17` entries.
- Confirm client-side view is unchanged: lead owner still sees proposals on own leads, approved Handwerker still sees active leads, Handwerker still sees leads they proposed on, admins unchanged.

## Technical notes

- Migration touches only policies on `public.leads` and `public.lead_proposals` plus one new function; no table or data changes.
- Policies are recreated with `DROP POLICY IF EXISTS` + `CREATE POLICY` so the migration is idempotent.
