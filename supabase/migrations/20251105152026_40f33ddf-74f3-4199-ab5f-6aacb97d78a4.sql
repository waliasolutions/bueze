-- Create function to trigger admin notification when handwerker registers
CREATE OR REPLACE FUNCTION public.trigger_admin_registration_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only trigger for new pending registrations (not updates)
  IF NEW.verification_status = 'pending' AND OLD IS NULL THEN
    PERFORM
      net.http_post(
        url := 'https://ztthhdlhuhtwaaennfia.supabase.co/functions/v1/send-admin-registration-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0dGhoZGxodWh0d2FhZW5uZmlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNDg2NzYsImV4cCI6MjA2NDYyNDY3Nn0.4_aty-J0w_eHsP9sTid0yID7ZNJhd1HGvLf8OJY1A8A'
        ),
        body := jsonb_build_object('profileId', NEW.id::text)
      );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on handwerker_profiles table
DROP TRIGGER IF EXISTS on_handwerker_registration_notify_admin ON public.handwerker_profiles;

CREATE TRIGGER on_handwerker_registration_notify_admin
  AFTER INSERT ON public.handwerker_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_admin_registration_notification();