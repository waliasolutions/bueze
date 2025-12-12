-- Allow handwerkers to view leads where they have submitted proposals
-- This enables them to see lead details in their Angebote tab even after leads are completed/closed
CREATE POLICY "Handwerkers can view leads with their proposals"
ON public.leads
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.lead_proposals 
    WHERE lead_proposals.lead_id = leads.id 
    AND lead_proposals.handwerker_id = auth.uid()
  )
);