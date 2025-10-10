-- Phase 1: Create storage bucket for lead media
INSERT INTO storage.buckets (id, name, public)
VALUES ('lead-media', 'lead-media', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policy: Authenticated users can upload to their own folder
CREATE POLICY "Users can upload lead media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'lead-media' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policy: Users can update their own files
CREATE POLICY "Users can update own lead media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'lead-media' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policy: Users can delete their own files
CREATE POLICY "Users can delete own lead media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'lead-media' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policy: Anyone can view (bucket is public)
CREATE POLICY "Anyone can view lead media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'lead-media');

-- Function to validate media URLs
CREATE OR REPLACE FUNCTION validate_lead_media()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate media_urls array
  IF array_length(NEW.media_urls, 1) > 10 THEN
    RAISE EXCEPTION 'Maximum 10 media files allowed per lead';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on leads table
DROP TRIGGER IF EXISTS validate_media_before_insert_update ON public.leads;
CREATE TRIGGER validate_media_before_insert_update
  BEFORE INSERT OR UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION validate_lead_media();

-- Phase 4: Add request_id for idempotency
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS request_id TEXT;

-- Create unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_request_id
ON public.leads (request_id)
WHERE request_id IS NOT NULL;

COMMENT ON COLUMN public.leads.request_id IS 'Unique request identifier for idempotent lead creation';