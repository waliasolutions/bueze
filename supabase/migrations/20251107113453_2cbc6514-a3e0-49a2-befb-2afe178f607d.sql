-- Create storage bucket for handwerker portfolio images
INSERT INTO storage.buckets (id, name, public)
VALUES ('handwerker-portfolio', 'handwerker-portfolio', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for handwerker portfolio bucket
CREATE POLICY "Handwerkers can upload own portfolio images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'handwerker-portfolio' AND
  auth.uid()::text = (storage.foldername(name))[1] AND
  EXISTS (
    SELECT 1 FROM handwerker_profiles
    WHERE user_id = auth.uid() AND verification_status = 'approved'
  )
);

CREATE POLICY "Handwerkers can update own portfolio images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'handwerker-portfolio' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Handwerkers can delete own portfolio images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'handwerker-portfolio' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view portfolio images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'handwerker-portfolio');