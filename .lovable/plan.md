## Problem

Majlinda Salihu's lead "Badezimmer sanieren" (created 2025-12-22) is still `status='active'` even though >10 days have passed. Root cause: `proposal_deadline IS NULL` on this row (legacy lead created before the `trigger_send_lead_notification` started populating that column). 

The expiry pipeline (`check_lead_expiry` SQL function + `lead-expiry-check` edge function + cron) only matches leads where `proposal_deadline < now()` — `NULL` deadlines are silently skipped forever. Two leads are currently stuck in this state:

```
12e98cba… "Ofen ersetzen (Test2)"   created 2025-12-12
e7a11fce… "Badezimmer sanieren"     created 2025-12-22  ← Majlinda
```

## Fix — SSOT, no parallel logic

One concept: **"a lead is expired when its effective deadline has passed"**, where the effective deadline is `COALESCE(proposal_deadline, created_at + 10 days)`. We make every layer agree on that single rule.

### 1. Data backfill (one-shot, via `insert tool`)

```sql
UPDATE leads
SET proposal_deadline = created_at + INTERVAL '10 days',
    updated_at = now()
WHERE proposal_deadline IS NULL;
```
Closes the drift on the 2 affected rows and prevents future ghosts. After this, the existing cron correctly sees Majlinda's lead as expired and processes it on the next tick.

### 2. Force-expire the affected leads now (via `insert tool`)

Run the same idempotent transition the cron would perform, so the user sees the fix immediately:

```sql
UPDATE leads
SET status = 'expired', updated_at = now()
WHERE status = 'active'
  AND COALESCE(proposal_deadline, created_at + INTERVAL '10 days') < now();
```

Plus the owner notification (matches what `markLeadExpired.ts` does), gated by a pre-check to stay idempotent:

```sql
INSERT INTO client_notifications (user_id, type, title, message, related_id, metadata)
SELECT l.owner_id, 'lead_expired', 'Auftrag abgelaufen',
       'Die Angebotsfrist für "' || l.title || '" ist abgelaufen.',
       l.id, jsonb_build_object('lead_title', l.title, 'reason', 'backfill_force_expire')
FROM leads l
WHERE l.id IN ('e7a11fce-0662-4ad2-a257-0a9e3c0d9be4',
               '12e98cba-581f-4ee0-9952-0a2648cc9296')
  AND NOT EXISTS (
    SELECT 1 FROM client_notifications cn
    WHERE cn.user_id = l.owner_id AND cn.type = 'lead_expired' AND cn.related_id = l.id
  );
```

Pending proposals on those leads also get withdrawn + handwerker notified (mirrors the cron's second loop) — same SQL pattern.

### 3. Harden `check_lead_expiry()` SQL function (migration)

Make the SSOT rule explicit so any future NULL deadline still expires:

```sql
CREATE OR REPLACE FUNCTION public.check_lead_expiry()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE leads
  SET status = 'expired'::lead_status, updated_at = now()
  WHERE status = 'active'::lead_status
    AND COALESCE(proposal_deadline, created_at + INTERVAL '10 days') < now();
END;
$$;
```

### 4. Harden `lead-expiry-check` edge function (same SSOT)

Replace the `.lt("proposal_deadline", ...)` filter — which silently skips NULL — with a query that also catches NULL-deadline leads >10 days old. Single `.or()` filter, no new code paths, still routes through the existing `markLeadExpired` shared helper. Also pass `created_at + 10d` as the synthesized deadline into the helper for the per-lead handwerker-notification loop, so its second pass behaves identically.

No changes to `markLeadExpired.ts` (it already handles whatever lead row it's given).

### 5. No frontend changes

The admin "Stop" action in `AdminLeadsManagement.tsx` already sets status manually — out of scope. The cron continues to run on its existing schedule and will now correctly process drifted leads on its own.

## Files

- Migration: harden `public.check_lead_expiry()` (step 3)
- `supabase/functions/lead-expiry-check/index.ts` — broaden the filter (step 4)
- One-shot SQL via insert tool — backfill + force-expire + notifications (steps 1–2)

## Verification

1. After steps 1–2: `SELECT status FROM leads WHERE id='e7a11fce-…'` returns `expired`; Majlinda has one new `client_notifications` row of type `lead_expired`.
2. `SELECT count(*) FROM leads WHERE status='active' AND COALESCE(proposal_deadline, created_at + interval '10 days') < now()` returns `0`.
3. Manually invoking `lead-expiry-check` is a no-op (idempotent — `markLeadExpired` filters by `status='active'`).
4. Future leads with somehow-NULL deadlines auto-expire on the next cron tick instead of lingering forever.

## Out of scope

- Adding a NOT NULL constraint on `proposal_deadline` (would break the existing INSERT path that relies on the trigger to fill it; the SSOT COALESCE makes it unnecessary).
- Changing the 10-day window itself.
- Race between cron and admin force-click — already documented in `markLeadExpired.ts`.
