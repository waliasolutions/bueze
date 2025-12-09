-- Fix Security Definer View issue by recreating view with SECURITY INVOKER
-- This ensures the view respects the RLS policies of the querying user

DROP VIEW IF EXISTS public.handwerker_rating_stats;

CREATE VIEW public.handwerker_rating_stats 
WITH (security_invoker = true) AS
SELECT 
  reviewed_id AS user_id,
  round(avg(rating), 1) AS average_rating,
  count(*) AS review_count
FROM public.reviews
WHERE is_public = true
GROUP BY reviewed_id;