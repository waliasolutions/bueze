-- Add RLS policy to allow admins to delete handwerker profiles
CREATE POLICY "Admins can delete handwerker profiles"
ON public.handwerker_profiles
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);