-- Create public storage bucket for sitemap
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'sitemaps',
  'sitemaps',
  true,
  1048576, -- 1MB limit
  ARRAY['application/xml', 'text/xml']
);

-- Create policy to allow public read access
CREATE POLICY "Public read access for sitemaps"
ON storage.objects FOR SELECT
USING (bucket_id = 'sitemaps');

-- Create policy to allow service role to upload/update
CREATE POLICY "Service role can manage sitemaps"
ON storage.objects FOR ALL
USING (bucket_id = 'sitemaps' AND auth.role() = 'service_role');