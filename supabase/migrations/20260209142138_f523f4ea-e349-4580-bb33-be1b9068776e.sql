
-- Fix: Update reviews admin RLS policies to include super_admin role
-- Drop and recreate the three affected policies

DROP POLICY IF EXISTS "Admins can view all reviews" ON public.reviews;
CREATE POLICY "Admins can view all reviews"
  ON public.reviews FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

DROP POLICY IF EXISTS "Admins can update all reviews" ON public.reviews;
CREATE POLICY "Admins can update all reviews"
  ON public.reviews FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete all reviews" ON public.reviews;
CREATE POLICY "Admins can delete all reviews"
  ON public.reviews FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));
