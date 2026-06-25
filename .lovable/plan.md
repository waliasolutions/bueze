## Goal
Simulate Lavdrim Mahmuti withdrawing his lead "Haus sanieren" — as if he clicked "Zurückziehen" in the client UI.

## Target row
- Lead: `c05c7b50-6089-4755-a99b-63596b76fb8f` ("Haus sanieren")
- Owner: Lavdrim Mahmuti (`7e0a8526-e758-41d6-933d-726da75b053a`, `info@daerendinger-malergipser.ch`)
- Current state: `status = active`, `proposals_count = 0`, `accepted_proposal_id = null` → safe to cancel, no handwerker notifications/refunds needed.

## Change
Run a single data update via the Supabase insert/update tool:

```sql
UPDATE public.leads
SET status = 'cancelled',
    updated_at = now()
WHERE id = 'c05c7b50-6089-4755-a99b-63596b76fb8f'
  AND owner_id = '7e0a8526-e758-41d6-933d-726da75b053a';
```

Status `cancelled` is the SSOT value defined in `src/config/leadStatuses.ts` for "Lead wurde vom Auftraggeber abgebrochen" — exactly the state a client-initiated withdrawal produces. No code changes needed.

## Out of scope
- No notification emails (none would fire client-side either when there are 0 proposals).
- No deletion — the lead stays visible to the owner with the "Abgebrochen" badge, identical to a real client withdrawal.

Confirm and I'll execute the update in build mode.