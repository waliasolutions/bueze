
-- 1. Drop overly broad public read policy on handwerker_profiles base table
DROP POLICY IF EXISTS "Public can view basic verified handwerker info" ON public.handwerker_profiles;

-- 2. Fix CMS privilege escalation: require admin role instead of just being logged in
DROP POLICY IF EXISTS "Admins can manage countries" ON public.countries;
CREATE POLICY "Admins can manage countries"
  ON public.countries
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage legal pages" ON public.legal_pages;
CREATE POLICY "Admins can manage legal pages"
  ON public.legal_pages
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage snippets" ON public.snippets;
CREATE POLICY "Admins can manage snippets"
  ON public.snippets
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage resources" ON public.resources;
CREATE POLICY "Admins can manage resources"
  ON public.resources
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

-- 3. Recreate public views with security_invoker so caller's RLS applies
ALTER VIEW public.handwerker_profiles_public SET (security_invoker = true);
ALTER VIEW public.billing_settings_public SET (security_invoker = true);

-- 3a. Ensure anon/authenticated can still read these public views
GRANT SELECT ON public.handwerker_profiles_public TO anon, authenticated;
GRANT SELECT ON public.billing_settings_public TO anon, authenticated;

-- 3b. Add a permissive RLS policy on handwerker_profiles for the rows the public view exposes,
-- so security_invoker queries through the view still return data for anon users.
CREATE POLICY "Public can view approved handwerker rows via view"
  ON public.handwerker_profiles
  FOR SELECT
  TO anon, authenticated
  USING (is_verified = true AND verification_status = 'approved');

-- Note: This re-grants SELECT on the base table, but the *direct* sensitive-column risk is
-- equivalent to before. To fully prevent direct base-table SELECT of sensitive columns by anon,
-- we revoke column-level SELECT on the financial/private columns from anon.
REVOKE SELECT (iban, bank_name, tax_id, mwst_number, uid_number,
               liability_insurance_policy_number, liability_insurance_provider,
               personal_address, personal_zip, personal_city, personal_canton,
               trade_license_number, verification_documents, verification_notes,
               zefix_data)
  ON public.handwerker_profiles FROM anon;

-- 4. Storage: tighten lead-media upload policy
DROP POLICY IF EXISTS "Anyone can upload lead media" ON storage.objects;
CREATE POLICY "Authenticated users can upload own lead media"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'lead-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
