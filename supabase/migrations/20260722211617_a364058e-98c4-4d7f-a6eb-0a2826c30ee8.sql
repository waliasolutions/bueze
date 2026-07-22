CREATE OR REPLACE FUNCTION public.list_image_backfill_candidates(
  p_bucket text,
  p_limit  int DEFAULT 20
)
RETURNS TABLE(name text, size bigint, mimetype text, created_at timestamptz)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, storage
AS $$
  SELECT
    o.name,
    (o.metadata->>'size')::bigint   AS size,
    (o.metadata->>'mimetype')::text AS mimetype,
    o.created_at
  FROM storage.objects o
  WHERE o.bucket_id = p_bucket
    AND (o.metadata->>'mimetype') IN ('image/jpeg','image/jpg','image/png')
  ORDER BY (o.metadata->>'size')::bigint DESC NULLS LAST
  LIMIT GREATEST(1, LEAST(p_limit, 200));
$$;

REVOKE EXECUTE ON FUNCTION public.list_image_backfill_candidates(text, int) FROM anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.list_image_backfill_candidates(text, int) TO service_role;