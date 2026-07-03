## Target
Multi Home's lead "Reinigung Hauswartung" (`4a606e4a-cd1f-4850-aa9f-01b00d53d033`), owner `455d2f7e-9626-40f4-aa1b-4ced13608418` (i.fo@multohome.ch).

Current state: `status=active`, 3 pending proposals from handwerker — no acceptance yet, no refunds involved.

## Change (single migration/update, SSOT via `leadStatuses.ts`)

```sql
-- 1. Soft-delete the lead exactly like a client withdrawal + deletion
UPDATE public.leads
SET status = 'deleted', updated_at = now()
WHERE id = '4a606e4a-cd1f-4850-aa9f-01b00d53d033'
  AND owner_id = '455d2f7e-9626-40f4-aa1b-4ced13608418';

-- 2. Close the 3 pending proposals so no reminder cron picks them up.
--    Direct status update — no trigger sends rejection emails (rejection
--    emails only fire when the app explicitly invokes send-proposal-rejection-email).
UPDATE public.lead_proposals
SET status = 'rejected', responded_at = now(), updated_at = now()
WHERE lead_id = '4a606e4a-cd1f-4850-aa9f-01b00d53d033'
  AND status = 'pending';
```

## Why no emails will fire
- No DB trigger sends email on proposal rejection or on lead status change to `deleted`.
- `proposal-deadline-reminder` and `lead-expiry-check` cron jobs filter by `status = 'active'` → skip deleted leads.
- `send-acceptance-emails` only triggers on `pending → accepted` — not touched here.
- Lead becomes invisible in search (`canView=false` for `deleted` in SSOT).

## Out of scope
- No hard delete (soft-delete matches the SSOT "Gelöscht" state and preserves audit trail, same as the client's own "Löschen" button).
- No manual notification to the 3 handwerker (per request: no emails).
