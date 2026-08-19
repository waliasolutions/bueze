-- SECURITY DEFINER helper to break the leads <-> lead_proposals RLS recursion
CREATE OR REPLACE FUNCTION public.is_lead_owner(lead_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.leads l
    WHERE l.id = lead_uuid AND l.owner_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_lead_owner(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_lead_owner(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_lead_owner(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_lead_owner(uuid) TO service_role;

-- leads SELECT: replace inline lead_proposals EXISTS with existing definer helper
DROP POLICY IF EXISTS "Leads are visible to owner, admins, verified handwerkers" ON public.leads;
CREATE POLICY "Leads are visible to owner, admins, verified handwerkers"
ON public.leads
FOR SELECT
USING (
  owner_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = (SELECT auth.uid())
      AND ur.role = ANY (ARRAY['admin'::app_role, 'super_admin'::app_role])
  )
  OR (
    status = 'active'::lead_status
    AND EXISTS (
      SELECT 1 FROM public.handwerker_profiles hp
      WHERE hp.user_id = (SELECT auth.uid())
        AND hp.is_verified = true
        AND hp.verification_status = 'approved'
    )
  )
  OR public.handwerker_has_proposal_on_lead(id)
);

-- lead_proposals: replace inline leads subqueries with definer helper
DROP POLICY IF EXISTS "Lead owners can view proposals for their leads" ON public.lead_proposals;
CREATE POLICY "Lead owners can view proposals for their leads"
ON public.lead_proposals
FOR SELECT
TO authenticated
USING (public.is_lead_owner(lead_id));

DROP POLICY IF EXISTS "Lead owners can update proposals for their leads" ON public.lead_proposals;
CREATE POLICY "Lead owners can update proposals for their leads"
ON public.lead_proposals
FOR UPDATE
TO authenticated
USING (public.is_lead_owner(lead_id))
WITH CHECK (status = ANY (ARRAY['accepted'::proposal_status, 'rejected'::proposal_status]));