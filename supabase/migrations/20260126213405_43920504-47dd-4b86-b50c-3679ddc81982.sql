-- Add 'expired' to lead_status enum
ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'expired';

-- Update function to check for expired leads
CREATE OR REPLACE FUNCTION public.check_lead_expiry()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Mark leads as expired if proposal_deadline has passed and they are still active
  UPDATE leads
  SET status = 'expired'::lead_status, updated_at = now()
  WHERE status = 'active'::lead_status
    AND proposal_deadline IS NOT NULL
    AND proposal_deadline < now();
END;
$$;