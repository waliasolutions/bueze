-- Drop and recreate the SELECT policy to include super_admin
DROP POLICY IF EXISTS "Admins can view all handwerker profiles" ON handwerker_profiles;

CREATE POLICY "Admins can view all handwerker profiles"
ON handwerker_profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'super_admin')
  )
);

-- Drop and recreate the UPDATE policy to include super_admin
DROP POLICY IF EXISTS "Admins can update handwerker profiles" ON handwerker_profiles;

CREATE POLICY "Admins can update handwerker profiles"
ON handwerker_profiles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'super_admin')
  )
);