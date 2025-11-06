-- Add SELECT policy for anon to read pending guest registrations
CREATE POLICY "Allow anon to read pending guest registrations"
ON public.handwerker_profiles
FOR SELECT
TO anon
USING (
  user_id IS NULL 
  AND verification_status = 'pending'
);