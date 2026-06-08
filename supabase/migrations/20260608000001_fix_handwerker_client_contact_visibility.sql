-- Allow handwerkers to read the client profile for leads where their proposal was accepted.
-- This is the minimal, scoped exception to the "users can only view own profile" rule.
-- The SSOT for visibility is lead_proposals.status = 'accepted'.
CREATE POLICY "Handwerkers can view accepted client profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.lead_proposals lp
      JOIN public.leads l ON lp.lead_id = l.id
      WHERE lp.handwerker_id = auth.uid()
        AND lp.status = 'accepted'
        AND l.owner_id = profiles.id
    )
  );
