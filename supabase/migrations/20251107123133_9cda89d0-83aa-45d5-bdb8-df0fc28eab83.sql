-- Update RLS policy for handwerker_profiles INSERT to allow authenticated users to create own profile
DROP POLICY IF EXISTS "Authenticated users can create own profile" ON handwerker_profiles;

CREATE POLICY "Authenticated users can create own profile"
ON handwerker_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND verification_status = 'pending');

-- Ensure leads table RLS checks approval status for handwerkers viewing leads
DROP POLICY IF EXISTS "Users can view active leads or own leads" ON leads;

CREATE POLICY "Users can view active leads or own leads"
ON leads FOR SELECT
TO authenticated
USING (
  status = 'active' 
  AND (
    auth.uid() = owner_id
    OR EXISTS (
      SELECT 1 FROM handwerker_profiles 
      WHERE user_id = auth.uid() 
      AND is_verified = true
      AND verification_status = 'approved'
    )
  )
  OR auth.uid() = owner_id
);