## Fix Bild-Backfill: correct 200-batch cap and per-button loading state

### 1. Lift the SQL batch cap to 200 (SSOT with the Edge Function)
New migration `supabase/migrations/<utc>_backfill_candidates_limit_200.sql`:

```sql
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
```

Edge Function already clamps at 200 — no code change there.

### 2. Track the active batch, not just the mode
In `src/pages/admin/ImageBackfill.tsx`:

- Change the loading key from `${bucket}:${mode}` to `${bucket}:${mode}:${limit}`.
- Update every button's `loading === …` comparison to include the limit, so only the button that was actually clicked shows its spinner. `disabled={loading !== null}` stays the same (still prevents concurrent runs).

### 3. Clarify the skip counter in the results panel
Add a one-line hint under "Übersprungen" (only shown when `skipped > 0 && compressed === 0`):

> "Übersprungen bedeutet: WebP wäre nicht kleiner als das Original — kein Fehler."

Purely a text change so the screenshot's `Komprimiert: 0 · Übersprungen: 16` stops looking like a failure.

### Verification
- Run `bun run build` (typecheck).
- Migration applied → RPC returns up to 200 rows (dry-run "Apply 200" then observe `Geprüft` = actual candidate count, not 50).
- Only the clicked Apply button spins.

### Out of scope
- Compression algorithm / quality ladder — already exhausted (7 attempts down to Q=0.55 / 1200 px). Further tightening risks visible quality loss on portfolio photos.
- Changing sort order away from `size DESC` — biggest-first is deliberate (largest storage wins first).
