-- =============================================================================
-- Repair script: accepted-offer data divergence
-- Date: 2026-06-12
-- Run MANUALLY via Supabase SQL editor (NOT a migration — data fix only).
-- Safe to re-run; touches only provably inconsistent rows.
-- =============================================================================
--
-- BACKGROUND
--   Pre-fix `acceptProposal` performed 3 non-atomic browser writes. Network
--   failures between steps left orphans:
--     A) leads.accepted_proposal_id set, but proposal still status='pending'
--     B) proposal status='accepted', but lead.status<>'completed'
--        or leads.accepted_proposal_id IS NULL
--   Both shapes correctly hide the client contact from the craftsman (RLS +
--   UI gate on proposal.status='accepted').
--
-- DIAGNOSTIC (run alone first — must return 0 after applying the migration
-- AND this repair script):
--
--   SELECT 'A: lead points to non-accepted proposal' AS kind, count(*) AS n
--     FROM public.leads l
--     JOIN public.lead_proposals p ON p.id = l.accepted_proposal_id
--    WHERE p.status <> 'accepted'
--   UNION ALL
--   SELECT 'B: accepted proposal with drifted lead', count(*)
--     FROM public.lead_proposals p
--     JOIN public.leads l ON l.id = p.lead_id
--    WHERE p.status = 'accepted'
--      AND (l.status <> 'completed' OR l.accepted_proposal_id IS NULL OR l.accepted_proposal_id <> p.id)
--   UNION ALL
--   SELECT 'C: leads with multiple accepted proposals (AMBIGUOUS — skipped)', count(*)
--     FROM (
--       SELECT lead_id FROM public.lead_proposals
--        WHERE status='accepted' GROUP BY lead_id HAVING count(*)>1
--     ) x;
--
-- =============================================================================

BEGIN;

-- Prevent retroactive email spam while we repair.
ALTER TABLE public.lead_proposals DISABLE TRIGGER on_proposal_accepted;

DO $$
DECLARE
  v_promoted     int := 0;
  v_lead_fixed   int := 0;
  v_rejected     int := 0;
  v_conv_created int := 0;
  v_notif_created int := 0;
  v_ambiguous    int := 0;
BEGIN
  -- C) Report ambiguous leads (2+ accepted proposals) — DO NOT auto-fix.
  SELECT count(*) INTO v_ambiguous
    FROM (
      SELECT lead_id FROM public.lead_proposals
       WHERE status = 'accepted'
       GROUP BY lead_id
      HAVING count(*) > 1
    ) x;
  RAISE NOTICE 'Ambiguous leads (multiple accepted proposals) — skipped: %', v_ambiguous;

  -- A) Promote proposals that the lead already points to as accepted.
  WITH upd AS (
    UPDATE public.lead_proposals p
       SET status = 'accepted',
           responded_at = COALESCE(p.responded_at, now()),
           updated_at = now()
      FROM public.leads l
     WHERE l.accepted_proposal_id = p.id
       AND p.status <> 'accepted'
       -- Skip ambiguous leads
       AND l.id NOT IN (
         SELECT lead_id FROM public.lead_proposals
          WHERE status = 'accepted'
          GROUP BY lead_id HAVING count(*) > 1
       )
    RETURNING p.id
  )
  SELECT count(*) INTO v_promoted FROM upd;
  RAISE NOTICE 'Stuck proposals promoted to accepted: %', v_promoted;

  -- B) Reverse drift: leads with an accepted proposal but lead not completed
  --    or accepted_proposal_id mismatched/null. Skip ambiguous.
  WITH upd AS (
    UPDATE public.leads l
       SET status = 'completed',
           accepted_proposal_id = p.id,
           updated_at = now()
      FROM public.lead_proposals p
     WHERE p.lead_id = l.id
       AND p.status = 'accepted'
       AND (l.status <> 'completed' OR l.accepted_proposal_id IS NULL OR l.accepted_proposal_id <> p.id)
       AND l.id NOT IN (
         SELECT lead_id FROM public.lead_proposals
          WHERE status = 'accepted'
          GROUP BY lead_id HAVING count(*) > 1
       )
    RETURNING l.id
  )
  SELECT count(*) INTO v_lead_fixed FROM upd;
  RAISE NOTICE 'Leads fixed (status/accepted_proposal_id): %', v_lead_fixed;

  -- Reject leftover pending proposals on repaired leads.
  WITH upd AS (
    UPDATE public.lead_proposals p
       SET status = 'rejected',
           responded_at = COALESCE(p.responded_at, now()),
           updated_at = now()
      FROM public.leads l
     WHERE p.lead_id = l.id
       AND l.accepted_proposal_id IS NOT NULL
       AND p.id <> l.accepted_proposal_id
       AND p.status = 'pending'
    RETURNING p.id
  )
  SELECT count(*) INTO v_rejected FROM upd;
  RAISE NOTICE 'Other pending proposals rejected: %', v_rejected;

  -- Backfill missing conversations for accepted proposals
  -- (only when BOTH profile rows exist — FK guard).
  WITH ins AS (
    INSERT INTO public.conversations (lead_id, homeowner_id, handwerker_id)
    SELECT l.id, l.owner_id, p.handwerker_id
      FROM public.lead_proposals p
      JOIN public.leads l ON l.id = p.lead_id
      JOIN public.profiles pc ON pc.id = l.owner_id
      JOIN public.profiles ph ON ph.id = p.handwerker_id
     WHERE p.status = 'accepted'
       AND NOT EXISTS (
         SELECT 1 FROM public.conversations c
          WHERE c.lead_id = l.id
            AND c.homeowner_id = l.owner_id
            AND c.handwerker_id = p.handwerker_id
       )
    RETURNING id
  )
  SELECT count(*) INTO v_conv_created FROM ins;
  RAISE NOTICE 'Conversations backfilled: %', v_conv_created;

  -- Backfill missing handwerker_notifications (proposal_accepted) — silent.
  WITH ins AS (
    INSERT INTO public.handwerker_notifications
      (user_id, type, title, message, related_id, metadata)
    SELECT p.handwerker_id,
           'proposal_accepted',
           'Offerte angenommen!',
           COALESCE(pc.full_name, 'Ein Kunde') || ' hat Ihre Offerte für "' || COALESCE(l.title, 'Projekt') || '" angenommen',
           p.id,
           jsonb_build_object('lead_id', l.id)
      FROM public.lead_proposals p
      JOIN public.leads l ON l.id = p.lead_id
      LEFT JOIN public.profiles pc ON pc.id = l.owner_id
     WHERE p.status = 'accepted'
       AND NOT EXISTS (
         SELECT 1 FROM public.handwerker_notifications n
          WHERE n.user_id = p.handwerker_id
            AND n.type = 'proposal_accepted'
            AND n.related_id = p.id
       )
    RETURNING id
  )
  SELECT count(*) INTO v_notif_created FROM ins;
  RAISE NOTICE 'Handwerker notifications backfilled: %', v_notif_created;
END $$;

-- Re-enable the trigger so future acceptances dispatch emails normally.
ALTER TABLE public.lead_proposals ENABLE TRIGGER on_proposal_accepted;

COMMIT;

-- Re-run the diagnostic block above; counts A and B must be 0.
