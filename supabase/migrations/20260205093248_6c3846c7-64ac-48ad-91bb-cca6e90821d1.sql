-- Create trigger function for proposal acceptance
CREATE OR REPLACE FUNCTION public.trigger_send_acceptance_emails()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    PERFORM net.http_post(
      url := 'https://ztthhdlhuhtwaaennfia.supabase.co/functions/v1/send-acceptance-emails',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0dGhoZGxodWh0d2FhZW5uZmlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNDg2NzYsImV4cCI6MjA2NDYyNDY3Nn0.4_aty-J0w_eHsP9sTid0yID7ZNJhd1HGvLf8OJY1A8A'
      ),
      body := jsonb_build_object('proposalId', NEW.id::text)
    );
  END IF;
  RETURN NEW;
END;
$function$;

-- Create trigger for proposal acceptance (drop if exists first)
DROP TRIGGER IF EXISTS on_proposal_accepted ON public.lead_proposals;

CREATE TRIGGER on_proposal_accepted
  AFTER UPDATE ON public.lead_proposals
  FOR EACH ROW
  WHEN (OLD.status = 'pending' AND NEW.status = 'accepted')
  EXECUTE FUNCTION public.trigger_send_acceptance_emails();

-- Repair missing conversations for accepted proposals
INSERT INTO conversations (lead_id, homeowner_id, handwerker_id, created_at)
SELECT 
  lp.lead_id,
  l.owner_id,
  lp.handwerker_id,
  NOW()
FROM lead_proposals lp
JOIN leads l ON lp.lead_id = l.id
LEFT JOIN conversations c ON c.lead_id = lp.lead_id AND c.handwerker_id = lp.handwerker_id
WHERE lp.status = 'accepted' AND c.id IS NULL
ON CONFLICT DO NOTHING;