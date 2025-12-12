-- Drop the policy causing infinite recursion
DROP POLICY IF EXISTS "Handwerkers can view leads with their proposals" ON public.leads;

-- Create a security definer function to break the recursion
CREATE OR REPLACE FUNCTION public.handwerker_has_proposal_on_lead(lead_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM lead_proposals 
    WHERE lead_proposals.lead_id = lead_uuid 
    AND lead_proposals.handwerker_id = auth.uid()
  );
$$;

-- Recreate the policy using the function (no recursion)
CREATE POLICY "Handwerkers can view leads with their proposals"
ON public.leads
FOR SELECT
USING (
  public.handwerker_has_proposal_on_lead(id)
);