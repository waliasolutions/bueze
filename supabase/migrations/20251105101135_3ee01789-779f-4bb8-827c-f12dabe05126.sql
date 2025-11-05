-- Create storage bucket for handwerker verification documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('handwerker-documents', 'handwerker-documents', false);

-- RLS policies for handwerker-documents bucket
CREATE POLICY "Handwerkers can upload own documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'handwerker-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Handwerkers can view own documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'handwerker-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all handwerker documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'handwerker-documents' AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  )
);

CREATE POLICY "Admins can delete handwerker documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'handwerker-documents' AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  )
);

-- Add verification status and notes to handwerker_profiles
ALTER TABLE handwerker_profiles
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected', 'needs_review')),
ADD COLUMN IF NOT EXISTS verification_notes TEXT,
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster admin queries
CREATE INDEX IF NOT EXISTS idx_handwerker_verification_status ON handwerker_profiles(verification_status);

-- Admin policy to view all handwerker profiles for verification
CREATE POLICY "Admins can view all handwerker profiles"
ON handwerker_profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  )
);

-- Admin policy to update handwerker profiles for verification
CREATE POLICY "Admins can update handwerker profiles"
ON handwerker_profiles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  )
);