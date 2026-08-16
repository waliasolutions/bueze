DROP POLICY IF EXISTS "Users can view active leads or own leads" ON public.leads;
DROP POLICY IF EXISTS "Handwerkers can view leads with their proposals" ON public.leads;
DROP POLICY IF EXISTS "Admins can view all leads" ON public.leads;

CREATE POLICY "Leads are visible to owner, admins, verified handwerkers"
ON public.leads
FOR SELECT
TO authenticated
USING (
  owner_id = (select auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = (select auth.uid())
      AND ur.role = ANY (ARRAY['admin'::app_role, 'super_admin'::app_role])
  )
  OR (
    status = 'active'::lead_status
    AND EXISTS (
      SELECT 1
      FROM public.handwerker_profiles hp
      WHERE hp.user_id = (select auth.uid())
        AND hp.is_verified = true
        AND hp.verification_status = 'approved'
    )
  )
  OR EXISTS (
    SELECT 1
    FROM public.lead_proposals lp
    WHERE lp.lead_id = leads.id
      AND lp.handwerker_id = (select auth.uid())
  )
);

CREATE INDEX IF NOT EXISTS idx_leads_owner_id ON public.leads USING btree (owner_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id_role ON public.user_roles USING btree (user_id, role);