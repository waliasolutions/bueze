-- Make user_id nullable in handwerker_profiles for guest registration
ALTER TABLE public.handwerker_profiles 
ALTER COLUMN user_id DROP NOT NULL;

-- Add constraint: approved profiles must have user_id
ALTER TABLE public.handwerker_profiles
ADD CONSTRAINT approved_must_have_user 
CHECK (
  (verification_status != 'approved' OR user_id IS NOT NULL)
);

-- Drop existing policy to update it
DROP POLICY IF EXISTS "Handwerkers can manage own profile" ON public.handwerker_profiles;

-- Recreate policy for authenticated handwerkers
CREATE POLICY "Handwerkers can manage own profile"
ON public.handwerker_profiles
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow anonymous inserts for guest registration
CREATE POLICY "Anyone can create guest handwerker profile"
ON public.handwerker_profiles
FOR INSERT
TO anon
WITH CHECK (user_id IS NULL AND verification_status = 'pending');