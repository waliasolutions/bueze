CREATE OR REPLACE FUNCTION public.revoke_proposal_acceptance(p_proposal_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_caller uuid := auth.uid();
  v_proposal RECORD;
  v_lead RECORD;
  v_is_admin boolean := false;
  v_is_handwerker boolean := false;
  v_is_owner boolean := false;
BEGIN
  IF v_caller IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Nicht angemeldet.');
  END IF;

  SELECT id, lead_id, handwerker_id, status, responded_at
    INTO v_proposal
    FROM public.lead_proposals
   WHERE id = p_proposal_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Offerte nicht gefunden.');
  END IF;

  IF v_proposal.status <> 'accepted' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Diese Offerte ist nicht angenommen.');
  END IF;

  SELECT id, owner_id, status, accepted_proposal_id, title
    INTO v_lead
    FROM public.leads
   WHERE id = v_proposal.lead_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Auftrag nicht gefunden.');
  END IF;

  v_is_admin := has_role(v_caller, 'admin'::app_role) OR has_role(v_caller, 'super_admin'::app_role);
  v_is_handwerker := v_proposal.handwerker_id = v_caller;
  v_is_owner := v_lead.owner_id = v_caller;

  IF NOT (v_is_admin OR v_is_handwerker OR v_is_owner) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Keine Berechtigung für diesen Auftrag.');
  END IF;

  -- Client may only revoke within 24h; handwerker and admin any time.
  IF v_is_owner AND NOT (v_is_admin OR v_is_handwerker) THEN
    IF COALESCE(v_proposal.responded_at, now()) < now() - interval '24 hours' THEN
      RETURN jsonb_build_object(
        'success', false,
        'message', 'Die Annahme liegt mehr als 24 Stunden zurück. Bitte kontaktieren Sie uns.'
      );
    END IF;
  END IF;

  UPDATE public.lead_proposals
     SET status = 'pending',
         responded_at = NULL,
         updated_at = now()
   WHERE id = p_proposal_id;

  UPDATE public.leads
     SET status = 'active'::lead_status,
         accepted_proposal_id = NULL,
         updated_at = now()
   WHERE id = v_lead.id;

  -- Notify the other party (in-app, SSOT notification tables).
  IF v_is_handwerker AND NOT v_is_owner THEN
    INSERT INTO public.client_notifications (user_id, type, title, message, related_id, metadata)
    VALUES (
      v_lead.owner_id,
      'proposal_revoked',
      'Auftrag storniert',
      'Der Handwerker hat den Auftrag «' || v_lead.title || '» storniert. Der Auftrag ist wieder offen für Offerten.',
      v_lead.id,
      jsonb_build_object('proposal_id', p_proposal_id, 'revoked_by', 'handwerker')
    );
  ELSE
    INSERT INTO public.handwerker_notifications (user_id, type, title, message, related_id, metadata)
    VALUES (
      v_proposal.handwerker_id,
      'proposal_revoked',
      'Annahme zurückgezogen',
      'Die Annahme Ihrer Offerte für «' || v_lead.title || '» wurde zurückgezogen. Ihre Offerte ist wieder offen.',
      v_lead.id,
      jsonb_build_object('proposal_id', p_proposal_id, 'revoked_by', CASE WHEN v_is_owner THEN 'client' ELSE 'admin' END)
    );
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Auftrag storniert. Die andere Partei wurde benachrichtigt.');
END;
$function$;

REVOKE ALL ON FUNCTION public.revoke_proposal_acceptance(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.revoke_proposal_acceptance(uuid) TO authenticated, service_role;