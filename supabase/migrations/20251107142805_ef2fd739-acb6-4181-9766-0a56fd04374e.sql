-- Add RLS policies for handwerker-portfolio bucket
-- Allow authenticated users to upload their own portfolio images
CREATE POLICY "Users can upload their own portfolio images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'handwerker-portfolio'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to read their own portfolio images
CREATE POLICY "Users can read their own portfolio images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'handwerker-portfolio'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own portfolio images
CREATE POLICY "Users can delete their own portfolio images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'handwerker-portfolio'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to upload their own logos to handwerker-documents
CREATE POLICY "Users can upload their own logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'handwerker-documents'
  AND (storage.foldername(name))[1] = 'logos'
  AND (
    (storage.foldername(name))[2] = 'pending' 
    OR (storage.foldername(name))[2] = auth.uid()::text
  )
);

-- Allow authenticated users to read their own logos
CREATE POLICY "Users can read their own logos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'handwerker-documents'
  AND (storage.foldername(name))[1] = 'logos'
  AND (
    (storage.foldername(name))[2] = 'pending'
    OR (storage.foldername(name))[2] = auth.uid()::text
  )
);

-- Allow authenticated users to delete their own logos
CREATE POLICY "Users can delete their own logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'handwerker-documents'
  AND (storage.foldername(name))[1] = 'logos'
  AND (
    (storage.foldername(name))[2] = 'pending'
    OR (storage.foldername(name))[2] = auth.uid()::text
  )
);