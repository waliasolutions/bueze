-- Clean up duplicate user_roles
-- Remove legacy 'user' role for users who have 'client' or 'handwerker' roles
DELETE FROM user_roles 
WHERE role = 'user' 
AND user_id IN (
  SELECT user_id 
  FROM user_roles 
  WHERE role IN ('client', 'handwerker')
);

-- Fix lead status data integrity
-- Update leads with accepted_proposal_id but wrong status to 'completed'
UPDATE leads 
SET status = 'completed'
WHERE accepted_proposal_id IS NOT NULL 
AND status != 'completed';