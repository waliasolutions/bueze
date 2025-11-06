-- Drop the incorrect policy
DROP POLICY IF EXISTS "Allow guest handwerker registration" ON public.handwerker_profiles;

-- Create correct policy for anon role
CREATE POLICY "Allow guest handwerker registration"
ON public.handwerker_profiles
FOR INSERT
TO anon
WITH CHECK (
  user_id IS NULL 
  AND verification_status = 'pending'
);