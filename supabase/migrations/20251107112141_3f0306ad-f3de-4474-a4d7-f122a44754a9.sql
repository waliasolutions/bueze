-- Add admin role for info@bueeze.ch
INSERT INTO public.user_roles (user_id, role)
VALUES ('7027f17a-31c5-4e22-bdea-20866356a04c', 'admin'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;