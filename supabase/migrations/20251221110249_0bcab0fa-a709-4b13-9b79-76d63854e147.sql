-- Fix the security definer views by recreating them WITHOUT SECURITY DEFINER
-- First, drop and recreate handwerker_profiles_public view
DROP VIEW IF EXISTS public.handwerker_profiles_public;

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
  business_zip,
  business_canton,
  business_city,
  is_verified,
  verification_status,
  verified_at,
  created_at,
  updated_at,
  search_text
FROM public.handwerker_profiles
WHERE is_verified = true AND verification_status = 'approved';

-- Grant select to authenticated and anon
GRANT SELECT ON public.handwerker_profiles_public TO authenticated, anon;

-- Fix handwerker_rating_stats view
DROP VIEW IF EXISTS public.handwerker_rating_stats;

CREATE VIEW public.handwerker_rating_stats AS
SELECT 
  reviewed_id AS user_id,
  ROUND(AVG(rating)::numeric, 2) AS average_rating,
  COUNT(*) AS review_count
FROM public.reviews
WHERE is_public = true
GROUP BY reviewed_id;

-- Grant select to authenticated and anon
GRANT SELECT ON public.handwerker_rating_stats TO authenticated, anon;

-- Fix expiring_documents view (drop and recreate without SECURITY DEFINER if it exists)
DROP VIEW IF EXISTS public.expiring_documents;

CREATE VIEW public.expiring_documents AS
SELECT 
  hd.id,
  hd.handwerker_profile_id,
  hd.user_id,
  hd.document_type,
  hd.document_name,
  hd.document_url,
  hd.document_number,
  hd.issuing_authority,
  hd.issued_date,
  hd.expiry_date,
  hd.status,
  hd.verified_at,
  hd.verified_by,
  hd.reminder_30_sent,
  hd.reminder_14_sent,
  hd.reminder_7_sent,
  hd.created_at,
  hd.updated_at,
  hp.first_name,
  hp.last_name,
  hp.company_name,
  hp.email,
  CASE
    WHEN hd.expiry_date < CURRENT_DATE THEN 'expired'
    WHEN hd.expiry_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'critical'
    WHEN hd.expiry_date <= CURRENT_DATE + INTERVAL '14 days' THEN 'warning'
    WHEN hd.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'upcoming'
    ELSE 'valid'
  END AS expiry_status
FROM public.handwerker_documents hd
JOIN public.handwerker_profiles hp ON hd.handwerker_profile_id = hp.id
WHERE hd.expiry_date IS NOT NULL;

-- Grant select only to authenticated (admins will check via RLS on base tables)
GRANT SELECT ON public.expiring_documents TO authenticated;

-- Fix function search paths for any functions that may be missing them
-- The validate_handwerker_data function is missing search_path
CREATE OR REPLACE FUNCTION public.validate_handwerker_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Validate first_name
  IF NEW.first_name IS NOT NULL THEN
    IF LENGTH(TRIM(NEW.first_name)) < 2 THEN
      RAISE EXCEPTION 'First name must be at least 2 characters';
    END IF;
    IF LOWER(NEW.first_name) ~ '(test|asdf|dummy|example|aaa|zzz)' THEN
      RAISE EXCEPTION 'Invalid first name detected';
    END IF;
  END IF;

  -- Validate last_name
  IF NEW.last_name IS NOT NULL THEN
    IF LENGTH(TRIM(NEW.last_name)) < 2 THEN
      RAISE EXCEPTION 'Last name must be at least 2 characters';
    END IF;
    IF LOWER(NEW.last_name) ~ '(test|asdf|dummy|example|aaa|zzz)' THEN
      RAISE EXCEPTION 'Invalid last name detected';
    END IF;
  END IF;

  -- Validate email
  IF NEW.email IS NOT NULL THEN
    IF LOWER(NEW.email) ~ '(test@test|example@example|asdf@|dummy@)' THEN
      RAISE EXCEPTION 'Invalid email detected';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;