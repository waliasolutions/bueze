-- Migration: Enforce proposal limits at the database level
-- Fixes: Race condition on proposal submission, no RLS limit enforcement, no duplicate check

-- 1. Add UNIQUE constraint to prevent duplicate proposals per lead per handwerker
CREATE UNIQUE INDEX IF NOT EXISTS idx_lead_proposals_unique_per_lead
  ON public.lead_proposals (lead_id, handwerker_id)
  WHERE status NOT IN ('withdrawn', 'rejected');

-- 2. Replace the RLS INSERT policy with one that includes proposal limit check
DROP POLICY IF EXISTS "Handwerkers can create proposals" ON public.lead_proposals;

CREATE POLICY "Handwerkers can create proposals with limit check"
  ON public.lead_proposals
  FOR INSERT TO authenticated
  WITH CHECK (
    handwerker_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.handwerker_profiles
      WHERE user_id = auth.uid()
      AND verification_status = 'approved'
    )
    AND can_submit_proposal(auth.uid())
  );
