-- 1. Backfill missing proposal_deadline on legacy rows (SSOT: 10-day window)
UPDATE public.leads
SET proposal_deadline = created_at + INTERVAL '10 days',
    updated_at = now()
WHERE proposal_deadline IS NULL;

-- 2. Force-expire all overdue active leads using the SSOT effective-deadline rule
UPDATE public.leads
SET status = 'expired'::lead_status, updated_at = now()
WHERE status = 'active'::lead_status
  AND COALESCE(proposal_deadline, created_at + INTERVAL '10 days') < now();

-- 3. Notify owners of newly expired leads (idempotent: skip if a notification already exists)
INSERT INTO public.client_notifications (user_id, type, title, message, related_id, metadata)
SELECT l.owner_id,
       'lead_expired',
       'Auftrag abgelaufen',
       'Die Angebotsfrist für "' || l.title || '" ist abgelaufen.',
       l.id,
       jsonb_build_object('lead_title', l.title, 'reason', 'backfill_force_expire')
FROM public.leads l
WHERE l.status = 'expired'::lead_status
  AND NOT EXISTS (
    SELECT 1 FROM public.client_notifications cn
    WHERE cn.user_id = l.owner_id
      AND cn.type = 'lead_expired'
      AND cn.related_id = l.id
  );

-- 4. Notify handwerkers with pending proposals on expired leads (idempotent)
INSERT INTO public.handwerker_notifications (user_id, type, title, message, related_id, metadata)
SELECT lp.handwerker_id,
       'lead_expired',
       'Auftrag abgelaufen',
       'Die Angebotsfrist für "' || l.title || '" ist abgelaufen. Ihr Angebot wurde nicht mehr berücksichtigt.',
       l.id,
       jsonb_build_object('lead_title', l.title)
FROM public.lead_proposals lp
JOIN public.leads l ON l.id = lp.lead_id
WHERE l.status = 'expired'::lead_status
  AND lp.status = 'pending'::proposal_status
  AND NOT EXISTS (
    SELECT 1 FROM public.handwerker_notifications hn
    WHERE hn.user_id = lp.handwerker_id
      AND hn.type = 'lead_expired'
      AND hn.related_id = l.id
  );

-- 5. Withdraw still-pending proposals on expired leads
UPDATE public.lead_proposals
SET status = 'withdrawn'::proposal_status, updated_at = now()
WHERE status = 'pending'::proposal_status
  AND lead_id IN (SELECT id FROM public.leads WHERE status = 'expired'::lead_status);