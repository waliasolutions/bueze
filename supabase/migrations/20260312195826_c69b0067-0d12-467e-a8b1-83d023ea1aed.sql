-- 1. Clear accepted_proposal_id on leads referencing amit.walia's proposals
UPDATE leads SET accepted_proposal_id = NULL
WHERE accepted_proposal_id IN (
  'f9a413a0-3049-423d-8911-678618f13080',
  '6596787e-1add-43ac-bbfc-0eb69779d2ba',
  '245e9ed7-804b-453c-8114-545fdf12b639',
  'a843196e-0a5e-4106-8849-0bb2239ced5a',
  '82ad098f-d694-477d-be16-e5f4607aa0a9',
  'a1edd123-0890-498d-aae8-adfa4ac9c9b2'
);

-- 2. Delete remaining lead_proposals for amit.walia
DELETE FROM lead_proposals WHERE handwerker_id = '4d5b0b6e-7df0-4f08-b986-48f9655364c3';

-- 3. Add missing 'user' role for 3 handwerkers
INSERT INTO user_roles (user_id, role) VALUES
  ('3d43d30b-77ee-42b3-8005-03103ed5e8d6', 'user'),
  ('b53010b7-b040-432d-90e9-89ba61c6517a', 'user'),
  ('2924d857-5154-47e4-9419-467d177a2403', 'user')
ON CONFLICT (user_id, role) DO NOTHING;