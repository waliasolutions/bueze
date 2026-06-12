
-- =============================================================================
-- 1. Atomic acceptance RPC
-- =============================================================================
CREATE OR REPLACE FUNCTION public.accept_proposal_atomic(p_proposal_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_proposal RECORD;
  v_lead RECORD;
  v_caller uuid := auth.uid();
BEGIN
  IF v_caller IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Nicht angemeldet.');
  END IF;

  -- Lock proposal
  SELECT id, lead_id, handwerker_id, status
    INTO v_proposal
    FROM public.lead_proposals
   WHERE id = p_proposal_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Offerte nicht gefunden.');
  END IF;

  IF v_proposal.status <> 'pending' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Diese Offerte wurde bereits bearbeitet.');
  END IF;

  -- Lock lead and authorize caller as owner
  SELECT id, owner_id, status, accepted_proposal_id
    INTO v_lead
    FROM public.leads
   WHERE id = v_proposal.lead_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Auftrag nicht gefunden.');
  END IF;

  IF v_lead.owner_id <> v_caller THEN
    RETURN jsonb_build_object('success', false, 'message', 'Keine Berechtigung für diesen Auftrag.');
  END IF;

  IF v_lead.status = 'completed' OR v_lead.accepted_proposal_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Für diesen Auftrag wurde bereits eine Offerte angenommen.');
  END IF;

  IF v_lead.status <> 'active' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Dieser Auftrag ist nicht mehr aktiv.');
  END IF;

  -- Lead: mark completed + link proposal
  UPDATE public.leads
     SET status = 'completed',
         accepted_proposal_id = p_proposal_id,
         updated_at = now()
   WHERE id = v_lead.id;

  -- Proposal: mark accepted (DB trigger on_proposal_accepted dispatches emails)
  UPDATE public.lead_proposals
     SET status = 'accepted',
         responded_at = now(),
         updated_at = now()
   WHERE id = p_proposal_id;

  -- Reject other pending proposals for the same lead
  UPDATE public.lead_proposals
     SET status = 'rejected',
         responded_at = now(),
         updated_at = now()
   WHERE lead_id = v_lead.id
     AND id <> p_proposal_id
     AND status = 'pending';

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Offerte angenommen! Beide Parteien wurden benachrichtigt.'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.accept_proposal_atomic(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_proposal_atomic(uuid) TO authenticated;

-- =============================================================================
-- 2. Contact-access RPC (SSOT for craftsman -> client contact)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_accepted_client_contacts(p_lead_ids uuid[])
RETURNS TABLE (
  lead_id uuid,
  client_id uuid,
  full_name text,
  email text,
  phone text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    l.id          AS lead_id,
    p.id          AS client_id,
    p.full_name,
    p.email,
    p.phone
  FROM public.lead_proposals lp
  JOIN public.leads l    ON l.id = lp.lead_id
  JOIN public.profiles p ON p.id = l.owner_id
  WHERE lp.handwerker_id = auth.uid()
    AND lp.status = 'accepted'
    AND l.id = ANY(p_lead_ids);
$$;

REVOKE ALL ON FUNCTION public.get_accepted_client_contacts(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_accepted_client_contacts(uuid[]) TO authenticated;

-- =============================================================================
-- 3. Recursion-proof RLS helper + policy replacement on profiles
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handwerker_can_view_client_profile(p_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.lead_proposals lp
    JOIN public.leads l ON l.id = lp.lead_id
    WHERE lp.handwerker_id = auth.uid()
      AND lp.status = 'accepted'
      AND l.owner_id = p_profile_id
  );
$$;

REVOKE ALL ON FUNCTION public.handwerker_can_view_client_profile(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.handwerker_can_view_client_profile(uuid) TO authenticated;

DROP POLICY IF EXISTS "Handwerkers can view accepted client profile" ON public.profiles;

CREATE POLICY "Handwerkers can view accepted client profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.handwerker_can_view_client_profile(id));
