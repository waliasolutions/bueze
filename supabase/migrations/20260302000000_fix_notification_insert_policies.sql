-- Fix notification INSERT policies: restrict to service_role only
-- Previously these had no TO clause, allowing any authenticated user to insert
-- fake notifications targeting any other user.
-- All notification inserts come from edge functions (service_role), never from frontend.

-- client_notifications
DROP POLICY IF EXISTS "System can insert notifications" ON public.client_notifications;
CREATE POLICY "System can insert notifications" ON public.client_notifications
  FOR INSERT TO service_role WITH CHECK (true);

-- handwerker_notifications
DROP POLICY IF EXISTS "System can insert notifications" ON public.handwerker_notifications;
CREATE POLICY "System can insert notifications" ON public.handwerker_notifications
  FOR INSERT TO service_role WITH CHECK (true);
