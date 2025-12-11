-- Trigger function for new message notifications
CREATE OR REPLACE FUNCTION public.trigger_send_message_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://ztthhdlhuhtwaaennfia.supabase.co/functions/v1/send-message-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0dGhoZGxodWh0d2FhZW5uZmlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNDg2NzYsImV4cCI6MjA2NDYyNDY3Nn0.4_aty-J0w_eHsP9sTid0yID7ZNJhd1HGvLf8OJY1A8A'
    ),
    body := jsonb_build_object('messageId', NEW.id::text)
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new messages
DROP TRIGGER IF EXISTS on_new_message ON public.messages;
CREATE TRIGGER on_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_send_message_notification();

-- Trigger function for new rating notifications
CREATE OR REPLACE FUNCTION public.trigger_send_rating_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://ztthhdlhuhtwaaennfia.supabase.co/functions/v1/send-rating-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0dGhoZGxodWh0d2FhZW5uZmlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNDg2NzYsImV4cCI6MjA2NDYyNDY3Nn0.4_aty-J0w_eHsP9sTid0yID7ZNJhd1HGvLf8OJY1A8A'
    ),
    body := jsonb_build_object('reviewId', NEW.id::text)
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new reviews
DROP TRIGGER IF EXISTS on_new_review ON public.reviews;
CREATE TRIGGER on_new_review
  AFTER INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_send_rating_notification();

-- Trigger function for rating response notifications
CREATE OR REPLACE FUNCTION public.trigger_send_rating_response_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only trigger when handwerker_response changes from NULL to a value
  IF OLD.handwerker_response IS NULL AND NEW.handwerker_response IS NOT NULL THEN
    PERFORM net.http_post(
      url := 'https://ztthhdlhuhtwaaennfia.supabase.co/functions/v1/send-rating-response-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0dGhoZGxodWh0d2FhZW5uZmlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNDg2NzYsImV4cCI6MjA2NDYyNDY3Nn0.4_aty-J0w_eHsP9sTid0yID7ZNJhd1HGvLf8OJY1A8A'
      ),
      body := jsonb_build_object('reviewId', NEW.id::text)
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for rating responses
DROP TRIGGER IF EXISTS on_rating_response ON public.reviews;
CREATE TRIGGER on_rating_response
  AFTER UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_send_rating_response_notification();