-- 1) Kandidaten-Logik: nicht-WebP immer, WebP nur wenn > 400 KB (heuristischer Proxy für "zu groß / breiter als 1600 px").
CREATE OR REPLACE FUNCTION public.list_image_backfill_candidates(p_bucket text, p_limit integer DEFAULT 20)
 RETURNS TABLE(name text, size bigint, mimetype text, created_at timestamp with time zone)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public', 'storage'
AS $function$
  SELECT
    o.name,
    (o.metadata->>'size')::bigint   AS size,
    (o.metadata->>'mimetype')::text AS mimetype,
    o.created_at
  FROM storage.objects o
  WHERE o.bucket_id = p_bucket
    AND (
      (o.metadata->>'mimetype') IN ('image/jpeg','image/jpg','image/png')
      OR (
        (o.metadata->>'mimetype') = 'image/webp'
        AND COALESCE((o.metadata->>'size')::bigint, 0) > 400000
      )
    )
  ORDER BY (o.metadata->>'size')::bigint DESC NULLS LAST
  LIMIT GREATEST(1, LEAST(p_limit, 200));
$function$;

-- 2) Bucket-Statistik-RPC für das Admin-Panel.
CREATE OR REPLACE FUNCTION public.get_bucket_storage_stats(p_bucket text)
 RETURNS TABLE(
   total_files bigint,
   total_bytes bigint,
   webp_files bigint,
   webp_bytes bigint,
   other_files bigint,
   other_bytes bigint
 )
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public', 'storage'
AS $function$
  SELECT
    COUNT(*)::bigint AS total_files,
    COALESCE(SUM((o.metadata->>'size')::bigint), 0)::bigint AS total_bytes,
    COUNT(*) FILTER (WHERE (o.metadata->>'mimetype') = 'image/webp')::bigint AS webp_files,
    COALESCE(SUM((o.metadata->>'size')::bigint) FILTER (WHERE (o.metadata->>'mimetype') = 'image/webp'), 0)::bigint AS webp_bytes,
    COUNT(*) FILTER (WHERE (o.metadata->>'mimetype') <> 'image/webp' OR (o.metadata->>'mimetype') IS NULL)::bigint AS other_files,
    COALESCE(SUM((o.metadata->>'size')::bigint) FILTER (WHERE (o.metadata->>'mimetype') <> 'image/webp' OR (o.metadata->>'mimetype') IS NULL), 0)::bigint AS other_bytes
  FROM storage.objects o
  WHERE o.bucket_id = p_bucket;
$function$;

REVOKE ALL ON FUNCTION public.get_bucket_storage_stats(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_bucket_storage_stats(text) TO authenticated, service_role;