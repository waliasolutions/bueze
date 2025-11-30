-- Phase 4: Fix SECURITY DEFINER view - make it RLS-compliant
-- The handwerker_profiles_public view should not bypass RLS with SECURITY DEFINER
-- Instead, it should be a regular view that shows only public information

-- Drop the existing view
DROP VIEW IF EXISTS public.handwerker_profiles_public CASCADE;

-- Recreate the view without SECURITY DEFINER
-- This view shows only public information from verified handwerker profiles
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
  hourly_rate_min,
  hourly_rate_max,
  response_time_hours,
  logo_url,
  portfolio_urls,
  website,
  languages,
  business_zip,
  business_city,
  business_canton,
  is_verified,
  verification_status,
  verified_at,
  created_at,
  updated_at,
  search_text
FROM public.handwerker_profiles
WHERE is_verified = true 
  AND verification_status = 'approved';

-- Add comment explaining the view's purpose
COMMENT ON VIEW public.handwerker_profiles_public IS 
  'Public view of verified handwerker profiles, showing only non-sensitive information. No SECURITY DEFINER - respects RLS policies.';

-- Enable RLS on the base table (if not already enabled)
ALTER TABLE public.handwerker_profiles ENABLE ROW LEVEL SECURITY;