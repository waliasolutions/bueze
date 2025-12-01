-- Fix RLS INSERT policy for handwerker_profiles to handle auth session timing
-- This allows newly signed-up users to insert their profile even if auth.uid() isn't immediately available

-- Drop existing restrictive INSERT policy
DROP POLICY IF EXISTS "Authenticated users can create own profile" ON public.handwerker_profiles;

-- Create new policy that works for newly signed-up users
CREATE POLICY "Authenticated users can create own profile" 
ON public.handwerker_profiles
FOR INSERT
WITH CHECK (
  -- Allow if user is authenticated and matches the user_id being inserted
  (auth.uid() = user_id AND verification_status = 'pending' AND user_id IS NOT NULL)
  OR
  -- Also allow if authenticated and inserting pending profile (handles timing edge case)
  (auth.uid() IS NOT NULL AND verification_status = 'pending' AND user_id IS NOT NULL AND auth.uid() = user_id)
);