INSERT INTO handwerker_subscriptions (user_id, plan_type, proposals_limit, status, current_period_start, current_period_end)
VALUES (
  '62012849-3858-41bb-a4b9-d4cae3848362',
  'free',
  5,
  'active',
  now(),
  now() + interval '30 days'
);