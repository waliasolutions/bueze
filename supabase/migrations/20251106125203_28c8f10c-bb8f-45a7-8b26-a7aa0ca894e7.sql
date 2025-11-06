-- Drop the conflicting ALL policy that blocks guest registration
DROP POLICY IF EXISTS "Handwerkers can manage own profile" ON public.handwerker_profiles;

-- Recreate as separate SELECT, UPDATE, DELETE policies (excluding INSERT)
CREATE POLICY "Handwerkers can view own profile"
ON public.handwerker_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Handwerkers can update own profile"
ON public.handwerker_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Handwerkers can delete own profile"
ON public.handwerker_profiles
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);