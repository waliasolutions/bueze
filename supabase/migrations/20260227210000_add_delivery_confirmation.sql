-- Add delivery confirmation to leads table
-- The handwerker must confirm project delivery before the client can leave a review

-- Add delivered_at timestamp (NULL means not yet delivered)
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ DEFAULT NULL;

-- Add delivered_by to track which handwerker confirmed delivery
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS delivered_by UUID DEFAULT NULL REFERENCES auth.users(id);

-- Index for efficient queries on delivered status
CREATE INDEX IF NOT EXISTS idx_leads_delivered_at ON public.leads (delivered_at) WHERE delivered_at IS NOT NULL;

-- RLS: Allow the accepted handwerker to mark a lead as delivered
-- Only the handwerker whose proposal was accepted can set delivered_at
CREATE POLICY "Accepted handwerker can mark lead as delivered"
ON public.leads FOR UPDATE
USING (
  -- Must have an accepted proposal from this handwerker
  EXISTS (
    SELECT 1 FROM public.lead_proposals lp
    WHERE lp.id = leads.accepted_proposal_id
    AND lp.handwerker_id = auth.uid()
    AND lp.status = 'accepted'
  )
  AND status = 'completed'
  AND delivered_at IS NULL
)
WITH CHECK (
  -- Can only set delivered_at and delivered_by, nothing else changes
  delivered_at IS NOT NULL
  AND delivered_by = auth.uid()
  AND status = 'completed'
);

-- Update the review creation RLS to require delivery confirmation
-- Drop the old permissive policy and add a stricter one
DROP POLICY IF EXISTS "Users can create reviews for completed work" ON public.reviews;

CREATE POLICY "Users can create reviews for delivered work"
ON public.reviews FOR INSERT
WITH CHECK (
  auth.uid() = reviewer_id
  AND EXISTS (
    SELECT 1 FROM public.leads l
    WHERE l.id = lead_id
    AND l.owner_id = auth.uid()
    AND l.delivered_at IS NOT NULL
  )
);
