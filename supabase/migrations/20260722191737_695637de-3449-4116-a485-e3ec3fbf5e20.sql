
CREATE OR REPLACE FUNCTION public.prevent_handwerker_lead_creation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Guest leads (no owner yet) pass through.
  IF NEW.owner_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Service role and admins bypass (recovery, test data, admin-created leads).
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF has_role(NEW.owner_id, 'admin'::app_role)
     OR has_role(NEW.owner_id, 'super_admin'::app_role) THEN
    RETURN NEW;
  END IF;

  -- Hard block: handwerker accounts cannot post client leads.
  IF has_role(NEW.owner_id, 'handwerker'::app_role) THEN
    RAISE EXCEPTION 'HANDWERKER_CANNOT_POST_LEADS'
      USING ERRCODE = 'P0001',
            HINT   = 'Handwerker-Konten koennen keine Auftraege als Auftraggeber erstellen.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_handwerker_lead_creation_trigger ON public.leads;

CREATE TRIGGER prevent_handwerker_lead_creation_trigger
BEFORE INSERT ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.prevent_handwerker_lead_creation();
