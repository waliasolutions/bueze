-- Update storage policies for lead-media bucket to allow guest uploads

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can upload lead media" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own lead media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own lead media" ON storage.objects;

-- Allow authenticated AND public users to upload to lead-media bucket
-- Files are organized by userId or sessionId
CREATE POLICY "Anyone can upload lead media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'lead-media'
);

-- Allow users to update files in their own folder (authenticated only)
CREATE POLICY "Users can update own lead media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'lead-media' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete files in their own folder (authenticated only)
CREATE POLICY "Users can delete own lead media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'lead-media' AND
  (storage.foldername(name))[1] = auth.uid()::text
);