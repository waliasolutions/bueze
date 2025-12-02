-- Fix FSG Zürisee AG profile data and ensure proper role/subscription

-- Update profile with correct names
UPDATE handwerker_profiles 
SET 
  first_name = 'Barbara', 
  last_name = 'Lani' 
WHERE company_name = 'FSG Zürisee AG';

-- Upsert handwerker role (ensures role is set)
INSERT INTO user_roles (user_id, role) 
SELECT user_id, 'handwerker'::app_role 
FROM handwerker_profiles 
WHERE company_name = 'FSG Zürisee AG' AND user_id IS NOT NULL
ON CONFLICT (user_id, role) DO UPDATE SET role = 'handwerker'::app_role;

-- Create subscription (if not exists)
INSERT INTO handwerker_subscriptions (user_id, plan_type, proposals_limit, proposals_used_this_period)
SELECT user_id, 'free', 5, 0 
FROM handwerker_profiles 
WHERE company_name = 'FSG Zürisee AG' AND user_id IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;