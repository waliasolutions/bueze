-- Lead Status State Machine Trigger
-- Validates that status transitions follow allowed paths.
-- Also enforces server-side updated_at timestamps.

CREATE OR REPLACE FUNCTION public.validate_lead_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  -- Always set updated_at from server (SSOT for timestamps)
  NEW.updated_at := now();

  -- If status hasn't changed, allow the update
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Define valid transitions
  IF (OLD.status = 'draft' AND NEW.status = 'active') OR
     (OLD.status = 'active' AND NEW.status IN ('paused', 'completed', 'cancelled', 'expired', 'deleted')) OR
     (OLD.status = 'paused' AND NEW.status IN ('active', 'cancelled', 'deleted')) OR
     (OLD.status = 'cancelled' AND NEW.status = 'active') THEN
    RETURN NEW;
  END IF;

  -- Log blocked transition for observability
  INSERT INTO audit_log (action, entity_type, entity_id, metadata, created_at)
  VALUES (
    'status_transition_blocked',
    'lead',
    OLD.id,
    jsonb_build_object(
      'from_status', OLD.status,
      'to_status', NEW.status,
      'owner_id', OLD.owner_id
    ),
    now()
  );

  RAISE EXCEPTION 'Invalid lead status transition from % to %', OLD.status, NEW.status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if present
DROP TRIGGER IF EXISTS trigger_validate_lead_status ON public.leads;

-- Create the trigger (BEFORE UPDATE so we can modify NEW and block invalid transitions)
CREATE TRIGGER trigger_validate_lead_status
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_lead_status_transition();
