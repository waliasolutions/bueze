-- 1) Remove the over-permissive table-level read policy (all columns, anon + authenticated).
DROP POLICY IF EXISTS "Public can view approved handwerker rows via view" ON public.handwerker_profiles;

-- 2) The restricted public projection stays the only public read path. Add the
--    insurance-provider trust signal used by the client proposal list.
CREATE OR REPLACE VIEW public.handwerker_profiles_public AS
SELECT
  id,
  user_id,
  company_name,
  company_legal_form,
  first_name,
  last_name,
  bio,
  logo_url,
  website,
  categories,
  service_areas,
  languages,
  business_city,
  business_canton,
  business_zip,
  business_address,
  email,
  phone_number,
  hourly_rate_min,
  hourly_rate_max,
  response_time_hours,
  portfolio_urls,
  is_verified,
  verification_status,
  verified_at,
  search_text,
  created_at,
  updated_at,
  liability_insurance_provider
FROM public.handwerker_profiles
WHERE is_verified = true
  AND verification_status = 'approved'::text;

GRANT SELECT ON public.handwerker_profiles_public TO anon, authenticated;

-- 3) No anonymous access to the base table at all (guest registration only inserts).
REVOKE SELECT ON public.handwerker_profiles FROM anon;

-- 4) Pending verification documents / logos must not be readable by anonymous users.
DROP POLICY IF EXISTS "Allow anonymous to read pending uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous to read pending logo uploads" ON storage.objects;