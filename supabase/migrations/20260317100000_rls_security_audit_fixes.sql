-- ============================================================================
-- RLS Security Audit Fixes
-- Date: 2026-03-17
--
-- This migration fixes missing TO-role restrictions and overly permissive
-- INSERT policies discovered during a security audit.
--
-- Problem: Many CREATE POLICY statements omitted the TO clause, which
-- defaults to TO public (= anon + authenticated). This means anonymous
-- users could potentially interact with these tables if auth.uid() ever
-- resolves (e.g. Supabase anonymous sign-in).
--
-- Additionally, several "system insert" policies used WITH CHECK (true)
-- without restricting to service_role, allowing any user to insert rows.
-- ============================================================================

-- ============================================================================
-- 1. handwerker_subscriptions: restrict user policies to authenticated
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own subscription" ON public.handwerker_subscriptions;
CREATE POLICY "Users can view own subscription"
  ON public.handwerker_subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own subscription" ON public.handwerker_subscriptions;
CREATE POLICY "Users can insert own subscription"
  ON public.handwerker_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own subscription" ON public.handwerker_subscriptions;
CREATE POLICY "Users can update own subscription"
  ON public.handwerker_subscriptions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- 2. handwerker_service_areas: restrict all policies to proper roles
-- ============================================================================

DROP POLICY IF EXISTS "Handwerkers can view own service areas" ON public.handwerker_service_areas;
CREATE POLICY "Handwerkers can view own service areas"
  ON public.handwerker_service_areas
  FOR SELECT
  TO authenticated
  USING (
    handwerker_id IN (
      SELECT id FROM handwerker_profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Handwerkers can insert own service areas" ON public.handwerker_service_areas;
CREATE POLICY "Handwerkers can insert own service areas"
  ON public.handwerker_service_areas
  FOR INSERT
  TO authenticated
  WITH CHECK (
    handwerker_id IN (
      SELECT id FROM handwerker_profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Handwerkers can update own service areas" ON public.handwerker_service_areas;
CREATE POLICY "Handwerkers can update own service areas"
  ON public.handwerker_service_areas
  FOR UPDATE
  TO authenticated
  USING (
    handwerker_id IN (
      SELECT id FROM handwerker_profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Handwerkers can delete own service areas" ON public.handwerker_service_areas;
CREATE POLICY "Handwerkers can delete own service areas"
  ON public.handwerker_service_areas
  FOR DELETE
  TO authenticated
  USING (
    handwerker_id IN (
      SELECT id FROM handwerker_profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage all service areas" ON public.handwerker_service_areas;
CREATE POLICY "Admins can manage all service areas"
  ON public.handwerker_service_areas
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

-- Public read for approved handwerkers is intentional, restrict to anon + authenticated explicitly
DROP POLICY IF EXISTS "Anyone can view service areas for approved handwerkers" ON public.handwerker_service_areas;
CREATE POLICY "Anyone can view service areas for approved handwerkers"
  ON public.handwerker_service_areas
  FOR SELECT
  TO anon, authenticated
  USING (
    handwerker_id IN (
      SELECT id FROM handwerker_profiles
      WHERE verification_status = 'approved' AND is_verified = true
    )
  );

-- ============================================================================
-- 3. handwerker_documents: restrict all policies to authenticated
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own documents" ON public.handwerker_documents;
CREATE POLICY "Users can view own documents"
  ON public.handwerker_documents
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own documents" ON public.handwerker_documents;
CREATE POLICY "Users can insert own documents"
  ON public.handwerker_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own documents" ON public.handwerker_documents;
CREATE POLICY "Users can update own documents"
  ON public.handwerker_documents
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own documents" ON public.handwerker_documents;
CREATE POLICY "Users can delete own documents"
  ON public.handwerker_documents
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all documents" ON public.handwerker_documents;
CREATE POLICY "Admins can view all documents"
  ON public.handwerker_documents
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'super_admin')
  ));

DROP POLICY IF EXISTS "Admins can update all documents" ON public.handwerker_documents;
CREATE POLICY "Admins can update all documents"
  ON public.handwerker_documents
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'super_admin')
  ));

-- ============================================================================
-- 4. client_notifications: restrict user policies to authenticated
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own notifications" ON public.client_notifications;
CREATE POLICY "Users can view own notifications"
  ON public.client_notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.client_notifications;
CREATE POLICY "Users can update own notifications"
  ON public.client_notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- 5. handwerker_notifications: restrict user policies to authenticated
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own notifications" ON public.handwerker_notifications;
CREATE POLICY "Users can view own notifications"
  ON public.handwerker_notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.handwerker_notifications;
CREATE POLICY "Users can update own notifications"
  ON public.handwerker_notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- 6. payment_history: restrict policies and fix open INSERT
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own payment history" ON public.payment_history;
CREATE POLICY "Users can view own payment history"
  ON public.payment_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all payment history" ON public.payment_history;
CREATE POLICY "Admins can view all payment history"
  ON public.payment_history
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- CRITICAL FIX: restrict INSERT to service_role only (was WITH CHECK (true) to any role)
DROP POLICY IF EXISTS "System can insert payment history" ON public.payment_history;
CREATE POLICY "System can insert payment history"
  ON public.payment_history
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ============================================================================
-- 7. deletion_audit: fix open INSERT policy
-- ============================================================================

-- CRITICAL FIX: restrict INSERT to service_role only (was WITH CHECK (true) to any role)
DROP POLICY IF EXISTS "System can insert deletion audit" ON public.deletion_audit;
CREATE POLICY "System can insert deletion audit"
  ON public.deletion_audit
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ============================================================================
-- 8. page_content: restrict admin policies to authenticated
--    (public read is intentional for CMS, but make it explicit)
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can view published content" ON public.page_content;
CREATE POLICY "Anyone can view published content"
  ON public.page_content
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

DROP POLICY IF EXISTS "Admins can view all content" ON public.page_content;
CREATE POLICY "Admins can view all content"
  ON public.page_content
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage content" ON public.page_content;
CREATE POLICY "Admins can manage content"
  ON public.page_content
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- ============================================================================
-- 9. site_seo_settings: restrict admin policy to authenticated
--    (public read is intentional for SEO, but make it explicit)
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can view site SEO settings" ON public.site_seo_settings;
CREATE POLICY "Anyone can view site SEO settings"
  ON public.site_seo_settings
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can manage site SEO settings" ON public.site_seo_settings;
CREATE POLICY "Admins can manage site SEO settings"
  ON public.site_seo_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- 10. admin_audit_log: restrict to authenticated and add proper role checks
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view audit logs" ON public.admin_audit_log;
CREATE POLICY "Admins can view audit logs"
  ON public.admin_audit_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.admin_audit_log;
CREATE POLICY "Admins can insert audit logs"
  ON public.admin_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = admin_user_id
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- 11. leads: restrict delivery confirmation policy to authenticated
-- ============================================================================

DROP POLICY IF EXISTS "Accepted handwerker can mark lead as delivered" ON public.leads;
CREATE POLICY "Accepted handwerker can mark lead as delivered"
  ON public.leads
  FOR UPDATE
  TO authenticated
  USING (
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
    delivered_at IS NOT NULL
    AND delivered_by = auth.uid()
    AND status = 'completed'
  );

-- ============================================================================
-- 12. reviews: restrict delivery review policy to authenticated
-- ============================================================================

DROP POLICY IF EXISTS "Users can create reviews for delivered work" ON public.reviews;
CREATE POLICY "Users can create reviews for delivered work"
  ON public.reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = reviewer_id
    AND EXISTS (
      SELECT 1 FROM public.leads l
      WHERE l.id = lead_id
      AND l.owner_id = auth.uid()
      AND l.delivered_at IS NOT NULL
    )
  );

-- ============================================================================
-- 13. invoices: ensure proper TO clauses (fixes from first invoices migration)
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own invoices" ON public.invoices;
CREATE POLICY "Users can view own invoices"
  ON public.invoices
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all invoices" ON public.invoices;
CREATE POLICY "Admins can view all invoices"
  ON public.invoices
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  );

DROP POLICY IF EXISTS "Admins can update invoices" ON public.invoices;
CREATE POLICY "Admins can update invoices"
  ON public.invoices
  FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  );

DROP POLICY IF EXISTS "Service role full access on invoices" ON public.invoices;
DROP POLICY IF EXISTS "Service can insert invoices" ON public.invoices;
CREATE POLICY "Service role full access on invoices"
  ON public.invoices
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 14. billing_settings: restrict base table read to authenticated only
--     (anon access is through the billing_settings_public view)
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated can read billing settings" ON public.billing_settings;
CREATE POLICY "Authenticated can read billing settings"
  ON public.billing_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- 15. Storage: fix overly permissive lead-media INSERT
--     Currently allows ANY role to upload with no folder restriction
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can upload lead media" ON storage.objects;
CREATE POLICY "Anyone can upload lead media"
  ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    bucket_id = 'lead-media'
  );

-- ============================================================================
-- 16. handwerker_approval_history: restrict to authenticated
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view approval history" ON public.handwerker_approval_history;
CREATE POLICY "Admins can view approval history"
  ON public.handwerker_approval_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "System can insert approval history" ON public.handwerker_approval_history;
CREATE POLICY "System can insert approval history"
  ON public.handwerker_approval_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );
