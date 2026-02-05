-- Fix: Add default user role for accounts missing role entries
INSERT INTO user_roles (user_id, role)
SELECT p.id, 'user'::app_role
FROM profiles p
LEFT JOIN user_roles ur ON p.id = ur.user_id
WHERE ur.role IS NULL
ON CONFLICT (user_id, role) DO NOTHING;