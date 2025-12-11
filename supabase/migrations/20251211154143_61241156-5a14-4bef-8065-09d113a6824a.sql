-- =============================================
-- FIX: Attach missing triggers for handwerker registration admin notifications
-- =============================================

-- Trigger for in-app admin notification when new handwerker registers
CREATE TRIGGER on_new_handwerker_registration_notify
  AFTER INSERT ON public.handwerker_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_of_new_registration();

-- Trigger for email admin notification when new handwerker registers
CREATE TRIGGER on_new_handwerker_registration_email
  AFTER INSERT ON public.handwerker_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_admin_registration_notification();

-- =============================================
-- NEW: In-app admin notification for new leads (Aufträge)
-- =============================================

-- Create function to insert admin notification when new lead becomes active
CREATE OR REPLACE FUNCTION public.notify_admins_of_new_lead()
RETURNS trigger AS $$
BEGIN
  -- Only trigger when lead status changes to 'active'
  IF NEW.status = 'active' AND (OLD IS NULL OR OLD.status != 'active') THEN
    INSERT INTO public.admin_notifications (type, title, message, related_id, metadata)
    VALUES (
      'new_lead',
      'Neuer Auftrag',
      'Neuer Auftrag: ' || NEW.category || ' in ' || NEW.city || ', ' || NEW.canton,
      NEW.id,
      jsonb_build_object(
        'category', NEW.category,
        'city', NEW.city,
        'canton', NEW.canton,
        'owner_id', NEW.owner_id
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Attach trigger for in-app admin notification when lead becomes active
CREATE TRIGGER on_new_lead_admin_notification
  AFTER INSERT OR UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_of_new_lead();