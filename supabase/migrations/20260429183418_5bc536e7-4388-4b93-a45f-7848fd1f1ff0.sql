CREATE OR REPLACE FUNCTION public.check_lead_expiry()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- SSOT: a lead expires when its effective deadline has passed.
  -- Effective deadline = COALESCE(proposal_deadline, created_at + 10 days).
  -- The COALESCE catches legacy/drifted rows where proposal_deadline is NULL
  -- (e.g. created before trigger_send_lead_notification populated the column),
  -- preventing them from staying 'active' forever.
  UPDATE leads
  SET status = 'expired'::lead_status, updated_at = now()
  WHERE status = 'active'::lead_status
    AND COALESCE(proposal_deadline, created_at + INTERVAL '10 days') < now();
END;
$function$;