-- Fix security definer view by setting security_invoker = true
DROP VIEW IF EXISTS public.handwerker_rating_stats;
CREATE VIEW public.handwerker_rating_stats 
WITH (security_invoker = true) AS
SELECT 
  reviewed_id as user_id,
  ROUND(AVG(rating)::numeric, 1) as average_rating,
  COUNT(*) as review_count
FROM public.reviews
WHERE is_public = true
GROUP BY reviewed_id;