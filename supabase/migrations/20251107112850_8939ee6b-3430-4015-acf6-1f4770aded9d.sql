-- Remove duplicate admin role for info@bueeze.ch (keep only super_admin)
DELETE FROM public.user_roles
WHERE user_id = '7027f17a-31c5-4e22-bdea-20866356a04c'
AND role = 'admin';