-- Backfill missing subscriptions for approved handwerkers
-- This fixes handwerkers who were approved before the subscription creation logic was added

INSERT INTO handwerker_subscriptions (user_id, plan_type, proposals_limit, proposals_used_this_period, status)
SELECT 
  hp.user_id, 
  'free', 
  5, 
  0,
  'active'
FROM handwerker_profiles hp
LEFT JOIN handwerker_subscriptions hs ON hs.user_id = hp.user_id
WHERE hp.verification_status = 'approved'
  AND hp.user_id IS NOT NULL
  AND hs.id IS NULL
ON CONFLICT (user_id) DO NOTHING;