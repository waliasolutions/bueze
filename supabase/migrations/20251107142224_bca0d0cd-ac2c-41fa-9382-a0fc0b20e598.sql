-- Allow anonymous users to read logo previews during registration
CREATE POLICY "Allow anonymous to read pending logo uploads"
ON storage.objects
FOR SELECT
TO anon
USING (
  bucket_id = 'handwerker-documents'
  AND (storage.foldername(name))[1] = 'logos'
  AND (storage.foldername(name))[2] = 'pending'
);