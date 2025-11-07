-- Grant admin role to info@walia-solutions.ch
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'info@walia-solutions.ch'
ON CONFLICT (user_id, role) DO NOTHING;

-- Grant admin role to info@bueeze.ch
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'info@bueeze.ch'
ON CONFLICT (user_id, role) DO NOTHING;