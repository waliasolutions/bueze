-- 1a. Admin SELECT policy on lead_proposals
CREATE POLICY "Admins can view all proposals" ON public.lead_proposals
  FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  );

-- 1b. SSOT recompute trigger function for leads.proposals_count
CREATE OR REPLACE FUNCTION public.sync_lead_proposals_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_lead uuid := COALESCE(NEW.lead_id, OLD.lead_id);
BEGIN
  UPDATE public.leads
  SET proposals_count = (
    SELECT count(*) FROM public.lead_proposals WHERE lead_id = target_lead
  )
  WHERE id = target_lead;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS on_lead_proposal_change_sync_count ON public.lead_proposals;
CREATE TRIGGER on_lead_proposal_change_sync_count
  AFTER INSERT OR DELETE ON public.lead_proposals
  FOR EACH ROW EXECUTE FUNCTION public.sync_lead_proposals_count();

-- 1c. Recreate trigger_send_proposal_notification WITHOUT the duplicate increment.
-- The count is now owned exclusively by sync_lead_proposals_count.
CREATE OR REPLACE FUNCTION public.trigger_send_proposal_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  PERFORM net.http_post(
    url := 'https://ztthhdlhuhtwaaennfia.supabase.co/functions/v1/send-proposal-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0dGhoZGxodWh0d2FhZW5uZmlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNDg2NzYsImV4cCI6MjA2NDYyNDY3Nn0.4_aty-J0w_eHsP9sTid0yID7ZNJhd1HGvLf8OJY1A8A'
    ),
    body := jsonb_build_object('proposalId', NEW.id::text)
  );
  RETURN NEW;
END;
$function$;

-- 1d. One-time backfill to correct existing drift
UPDATE public.leads l
SET proposals_count = (
  SELECT count(*) FROM public.lead_proposals p WHERE p.lead_id = l.id
);