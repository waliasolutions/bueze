-- Grant super_admin role to info@walia-solutions.ch
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin'::app_role
FROM auth.users
WHERE email = 'info@walia-solutions.ch'
ON CONFLICT (user_id, role) DO NOTHING;

-- Grant super_admin role to info@bueeze.ch
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin'::app_role
FROM auth.users
WHERE email = 'info@bueeze.ch'
ON CONFLICT (user_id, role) DO NOTHING;