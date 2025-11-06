-- Add RLS policy for authenticated users to create guest handwerker profiles
CREATE POLICY "Authenticated users can create guest handwerker profile"
ON public.handwerker_profiles
FOR INSERT
TO authenticated
WITH CHECK (
  user_id IS NULL 
  AND verification_status = 'pending'
);