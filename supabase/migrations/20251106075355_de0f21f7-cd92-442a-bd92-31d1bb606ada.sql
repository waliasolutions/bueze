-- Allow anonymous users to upload documents to the pending folder
CREATE POLICY "Allow anonymous uploads to pending folder"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (
  bucket_id = 'handwerker-documents' AND
  (storage.foldername(name))[1] = 'pending'
);

-- Allow anonymous users to read their own pending uploads
CREATE POLICY "Allow anonymous to read pending uploads"
ON storage.objects
FOR SELECT
TO anon
USING (
  bucket_id = 'handwerker-documents' AND
  (storage.foldername(name))[1] = 'pending'
);