-- Delete orphaned records for info@mentorgeruest.ch (c5168941-241e-41f2-88e6-4c97af9d7673)
-- This user was created but registration failed due to internet issues

-- 1. Delete from user_roles first (FK dependency)
DELETE FROM public.user_roles WHERE user_id = 'c5168941-241e-41f2-88e6-4c97af9d7673';

-- 2. Delete from profiles
DELETE FROM public.profiles WHERE id = 'c5168941-241e-41f2-88e6-4c97af9d7673';

-- 3. Delete from auth.users
DELETE FROM auth.users WHERE id = 'c5168941-241e-41f2-88e6-4c97af9d7673';