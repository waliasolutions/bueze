-- Add logo_url column to handwerker_profiles table
ALTER TABLE public.handwerker_profiles 
ADD COLUMN IF NOT EXISTS logo_url text;

COMMENT ON COLUMN public.handwerker_profiles.logo_url IS 'URL to the company/personal logo stored in Supabase Storage';

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Handwerkers can upload own logos" ON storage.objects;
DROP POLICY IF EXISTS "Handwerkers can update own logos" ON storage.objects;
DROP POLICY IF EXISTS "Handwerkers can delete own logos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view handwerker logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous logo upload during registration" ON storage.objects;

-- Create RLS policies for handwerker-documents bucket logo uploads
CREATE POLICY "Handwerkers can upload own logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'handwerker-documents' 
  AND (storage.foldername(name))[1] = 'logos'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "Handwerkers can update own logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'handwerker-documents' 
  AND (storage.foldername(name))[1] = 'logos'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "Handwerkers can delete own logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'handwerker-documents' 
  AND (storage.foldername(name))[1] = 'logos'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "Anyone can view handwerker logos"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'handwerker-documents' 
  AND (storage.foldername(name))[1] = 'logos'
);

CREATE POLICY "Allow anonymous logo upload during registration"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (
  bucket_id = 'handwerker-documents' 
  AND (storage.foldername(name))[1] = 'logos'
  AND (storage.foldername(name))[2] = 'pending'
);