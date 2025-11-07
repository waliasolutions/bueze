-- Add handwerker role to user metadata for marketing.wsolutions@gmail.com
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "handwerker"}'::jsonb
WHERE email = 'marketing.wsolutions@gmail.com';