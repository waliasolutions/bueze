-- Drop and recreate views without SECURITY DEFINER (use security_invoker instead)

-- 1. Drop existing views
DROP VIEW IF EXISTS public.handwerker_profiles_public CASCADE;
DROP VIEW IF EXISTS public.handwerker_rating_stats CASCADE;
DROP VIEW IF EXISTS public.expiring_documents CASCADE;

-- 2. Recreate handwerker_profiles_public with security_invoker
CREATE VIEW public.handwerker_profiles_public 
WITH (security_invoker = true)
AS SELECT 
  id,
  user_id,
  company_name,
  first_name,
  last_name,
  bio,
  logo_url,
  website,
  categories,
  service_areas,
  hourly_rate_min,
  hourly_rate_max,
  response_time_hours,
  languages,
  portfolio_urls,
  company_legal_form,
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
WHERE verification_status = 'approved' AND is_verified = true;

-- 3. Recreate handwerker_rating_stats with security_invoker
CREATE VIEW public.handwerker_rating_stats
WITH (security_invoker = true)
AS SELECT 
  reviewed_id as user_id,
  ROUND(AVG(rating)::numeric, 2) as average_rating,
  COUNT(*) as review_count
FROM public.reviews
WHERE is_public = true
GROUP BY reviewed_id;

-- 4. Recreate expiring_documents with security_invoker
CREATE VIEW public.expiring_documents
WITH (security_invoker = true)
AS SELECT 
  hd.id,
  hd.handwerker_profile_id,
  hd.user_id,
  hd.document_type,
  hd.document_name,
  hd.document_url,
  hd.document_number,
  hd.expiry_date,
  hd.issued_date,
  hd.issuing_authority,
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
    WHEN hd.expiry_date IS NULL THEN 'no_expiry'
    WHEN hd.expiry_date < CURRENT_DATE THEN 'expired'
    WHEN hd.expiry_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'expires_7_days'
    WHEN hd.expiry_date <= CURRENT_DATE + INTERVAL '14 days' THEN 'expires_14_days'
    WHEN hd.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'expires_30_days'
    ELSE 'valid'
  END as expiry_status
FROM public.handwerker_documents hd
JOIN public.handwerker_profiles hp ON hp.id = hd.handwerker_profile_id
WHERE hd.expiry_date IS NOT NULL AND hd.expiry_date <= CURRENT_DATE + INTERVAL '30 days';

-- Grant select to authenticated users for the views
GRANT SELECT ON public.handwerker_profiles_public TO authenticated, anon;
GRANT SELECT ON public.handwerker_rating_stats TO authenticated, anon;
GRANT SELECT ON public.expiring_documents TO authenticated;

-- 5. Cleanup orphaned handwerker role records
DELETE FROM public.user_roles 
WHERE role = 'handwerker' 
AND user_id NOT IN (
  SELECT user_id FROM public.handwerker_profiles WHERE user_id IS NOT NULL
);