-- Update existing 'user' role to 'super_admin' for info@walia-solutions.ch
UPDATE public.user_roles
SET role = 'super_admin'::app_role
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'info@walia-solutions.ch')
AND role = 'user'::app_role;

-- Update existing 'user' role to 'super_admin' for info@bueeze.ch
UPDATE public.user_roles
SET role = 'super_admin'::app_role
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'info@bueeze.ch')
AND role = 'user'::app_role;