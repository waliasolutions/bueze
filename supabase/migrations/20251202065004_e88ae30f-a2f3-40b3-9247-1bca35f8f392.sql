-- Create missing conversations for accepted proposals
-- This fixes the bug where proposals were accepted but no conversations were created
INSERT INTO conversations (lead_id, homeowner_id, handwerker_id, created_at, updated_at)
SELECT 
  l.id as lead_id,
  l.owner_id as homeowner_id,
  lp.handwerker_id,
  lp.responded_at as created_at,
  lp.responded_at as updated_at
FROM lead_proposals lp
JOIN leads l ON lp.lead_id = l.id
WHERE lp.status = 'accepted'
  AND NOT EXISTS (
    SELECT 1 FROM conversations c 
    WHERE c.lead_id = lp.lead_id 
    AND c.handwerker_id = lp.handwerker_id
  );