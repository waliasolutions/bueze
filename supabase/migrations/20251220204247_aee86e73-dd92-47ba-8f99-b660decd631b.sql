-- Clean up orphaned records for benimulaj6@gmail.com
-- This user has records in profiles and user_roles but no corresponding auth user

-- Delete from user_roles first (references profiles)
DELETE FROM public.user_roles 
WHERE user_id = '8d55b5cc-28b8-45f6-ba5c-50b63ce043c6';

-- Delete from profiles
DELETE FROM public.profiles 
WHERE id = '8d55b5cc-28b8-45f6-ba5c-50b63ce043c6';

-- Also delete any handwerker-related data that might exist
DELETE FROM public.handwerker_subscriptions 
WHERE user_id = '8d55b5cc-28b8-45f6-ba5c-50b63ce043c6';

DELETE FROM public.handwerker_notifications 
WHERE user_id = '8d55b5cc-28b8-45f6-ba5c-50b63ce043c6';

DELETE FROM public.client_notifications 
WHERE user_id = '8d55b5cc-28b8-45f6-ba5c-50b63ce043c6';

DELETE FROM public.magic_tokens 
WHERE user_id = '8d55b5cc-28b8-45f6-ba5c-50b63ce043c6';