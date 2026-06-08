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
        AND l.owner_id = public.profiles.id
    )
  );