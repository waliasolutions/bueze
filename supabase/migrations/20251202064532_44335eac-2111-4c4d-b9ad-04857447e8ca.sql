-- Fix Test AG missing subscription and categories
-- 1. Create missing subscription for Test AG
INSERT INTO handwerker_subscriptions (user_id, plan_type, proposals_limit, proposals_used_this_period, status)
SELECT 
  user_id, 
  'free', 
  5, 
  0,
  'active'
FROM handwerker_profiles 
WHERE company_name = 'Test AG' 
  AND user_id IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- 2. Update Test AG categories to use major category for proper lead matching
UPDATE handwerker_profiles 
SET categories = ARRAY['bau_renovation']::handwerker_category[]
WHERE company_name = 'Test AG';