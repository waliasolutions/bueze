-- Add admin RLS policies for reviews table to allow moderation

-- Allow admins to view all reviews
CREATE POLICY "Admins can view all reviews"
ON public.reviews
FOR SELECT
USING (get_user_role(auth.uid()) = 'admin');

-- Allow admins to update any review (for moderation)
CREATE POLICY "Admins can update all reviews"
ON public.reviews
FOR UPDATE
USING (get_user_role(auth.uid()) = 'admin');

-- Allow admins to delete any review (for moderation)
CREATE POLICY "Admins can delete all reviews"
ON public.reviews
FOR DELETE
USING (get_user_role(auth.uid()) = 'admin');