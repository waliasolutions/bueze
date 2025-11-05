-- Create the trigger for admin notifications on handwerker registration
DROP TRIGGER IF EXISTS on_handwerker_registration_notify_admin ON public.handwerker_profiles;

CREATE TRIGGER on_handwerker_registration_notify_admin
  AFTER INSERT ON public.handwerker_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_admin_registration_notification();