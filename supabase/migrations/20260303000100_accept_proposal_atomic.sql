-- Atomic RPC for Proposal Acceptance
-- Eliminates "Ghost Lead" risk by handling lead update, proposal acceptance,
-- and rejection of other proposals in a single transaction.
-- Uses p_proposal_id as natural idempotency key for double-click safety.

CREATE OR REPLACE FUNCTION public.accept_proposal_atomic(
  p_proposal_id UUID,
  p_lead_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_lead_status TEXT;
  v_proposal_status TEXT;
  v_accepted_count INT;
  v_rejected_count INT;
BEGIN
  -- Lock the lead row to prevent concurrent acceptance
  SELECT status INTO v_lead_status
  FROM leads WHERE id = p_lead_id FOR UPDATE;

  IF v_lead_status IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'lead_not_found');
  END IF;

  IF v_lead_status = 'completed' THEN
    -- Idempotency: if lead is already completed with THIS proposal, return success
    IF (SELECT accepted_proposal_id FROM leads WHERE id = p_lead_id) = p_proposal_id THEN
      RETURN jsonb_build_object('success', true, 'idempotent', true, 'accepted', 0, 'rejected', 0);
    END IF;
    RETURN jsonb_build_object('success', false, 'error', 'lead_not_active');
  END IF;

  IF v_lead_status != 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'lead_not_active');
  END IF;

  -- Lock the proposal row
  SELECT status INTO v_proposal_status
  FROM lead_proposals WHERE id = p_proposal_id FOR UPDATE;

  IF v_proposal_status IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'proposal_not_found');
  END IF;

  IF v_proposal_status = 'accepted' THEN
    -- Idempotency: already accepted, safe no-op
    RETURN jsonb_build_object('success', true, 'idempotent', true, 'accepted', 0, 'rejected', 0);
  END IF;

  IF v_proposal_status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'proposal_not_pending');
  END IF;

  -- Atomic: update lead to completed
  UPDATE leads SET status = 'completed', accepted_proposal_id = p_proposal_id,
    updated_at = now() WHERE id = p_lead_id;

  -- Atomic: accept the proposal
  UPDATE lead_proposals SET status = 'accepted', responded_at = now()
    WHERE id = p_proposal_id;
  v_accepted_count := 1;

  -- Atomic: reject all other pending proposals for this lead
  UPDATE lead_proposals SET status = 'rejected', responded_at = now()
    WHERE lead_id = p_lead_id AND id != p_proposal_id AND status = 'pending';
  GET DIAGNOSTICS v_rejected_count = ROW_COUNT;

  -- Log the transaction for server-side observability
  INSERT INTO audit_log (action, entity_type, entity_id, metadata, created_at)
  VALUES (
    'proposal_accepted',
    'lead_proposal',
    p_proposal_id,
    jsonb_build_object(
      'lead_id', p_lead_id,
      'rejected_count', v_rejected_count
    ),
    now()
  );

  RETURN jsonb_build_object(
    'success', true,
    'accepted', v_accepted_count,
    'rejected', v_rejected_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
