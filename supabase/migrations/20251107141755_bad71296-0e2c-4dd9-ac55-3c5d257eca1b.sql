-- Make handwerker-documents bucket public so logo previews work during registration
UPDATE storage.buckets 
SET public = true 
WHERE id = 'handwerker-documents';