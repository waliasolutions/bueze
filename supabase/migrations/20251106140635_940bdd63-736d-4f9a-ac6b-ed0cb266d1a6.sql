-- Fix RLS policies for guest handwerker registration
-- Drop duplicate/conflicting policies
DROP POLICY IF EXISTS "Anyone can create guest handwerker profile" ON public.handwerker_profiles;
DROP POLICY IF EXISTS "Authenticated users can create guest handwerker profile" ON public.handwerker_profiles;

-- Create a single, clear policy for guest registration (works for both anonymous and authenticated)
CREATE POLICY "Allow guest handwerker registration"
ON public.handwerker_profiles
FOR INSERT
TO public
WITH CHECK (
  user_id IS NULL 
  AND verification_status = 'pending'
);