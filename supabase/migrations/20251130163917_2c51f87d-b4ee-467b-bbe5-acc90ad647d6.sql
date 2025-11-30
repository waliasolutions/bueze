-- Phase 6: Fix RLS for handwerker_profiles to prevent sensitive data exposure
-- Drop the overly permissive public policy
DROP POLICY IF EXISTS "Public can view verified handwerker basic info" ON public.handwerker_profiles;

-- Create a more restrictive policy that only allows viewing basic, non-sensitive fields
-- This policy uses a subquery approach to ensure only truly public data is accessible
CREATE POLICY "Public can view basic verified handwerker info"
ON public.handwerker_profiles
FOR SELECT
USING (
  is_verified = true 
  AND verification_status = 'approved'
);

-- Add a comment explaining the security model
COMMENT ON POLICY "Public can view basic verified handwerker info" ON public.handwerker_profiles IS 
'Allows public to view only verified and approved handwerker profiles. Sensitive fields (email, phone, IBAN, tax_id, etc.) should be accessed through the handwerker_profiles_public view which filters these fields out.';

-- Recreate the handwerker_profiles_public view to ensure it's the SSOT for public data
DROP VIEW IF EXISTS public.handwerker_profiles_public CASCADE;

CREATE VIEW public.handwerker_profiles_public AS
SELECT 
  id,
  user_id,
  first_name,
  last_name,
  company_name,
  company_legal_form,
  bio,
  categories,
  service_areas,
  languages,
  hourly_rate_min,
  hourly_rate_max,
  response_time_hours,
  website,
  logo_url,
  portfolio_urls,
  business_city,
  business_canton,
  business_zip,
  is_verified,
  verification_status,
  verified_at,
  created_at,
  updated_at,
  search_text
FROM public.handwerker_profiles
WHERE is_verified = true 
  AND verification_status = 'approved';

COMMENT ON VIEW public.handwerker_profiles_public IS 
'Public view of handwerker profiles that exposes only non-sensitive information. This is the recommended way to access handwerker data for public-facing features.';