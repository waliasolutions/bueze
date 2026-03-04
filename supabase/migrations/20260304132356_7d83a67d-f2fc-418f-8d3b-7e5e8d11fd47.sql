
-- Issue 2: Add 'inactive' to verification_status CHECK constraint
-- First check if there's a CHECK constraint; the column is text with no CHECK, so we just need to ensure
-- the public view already filters by 'approved', so inactive profiles won't appear.

-- Issue 3: Recreate handwerker_profiles_public view with contact details
DROP VIEW IF EXISTS public.handwerker_profiles_public CASCADE;

CREATE VIEW public.handwerker_profiles_public AS
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
  updated_at
FROM public.handwerker_profiles
WHERE is_verified = true
  AND verification_status = 'approved';

-- Grant access
GRANT SELECT ON public.handwerker_profiles_public TO anon, authenticated;
