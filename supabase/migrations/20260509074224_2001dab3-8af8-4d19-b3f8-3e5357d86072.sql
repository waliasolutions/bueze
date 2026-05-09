
-- 1. Lock down deletion_audit INSERT to service_role
DROP POLICY IF EXISTS "System can insert deletion audit" ON public.deletion_audit;
CREATE POLICY "Service role can insert deletion audit"
ON public.deletion_audit FOR INSERT TO service_role WITH CHECK (true);

-- 2. Lock down client_notifications INSERT to service_role
DROP POLICY IF EXISTS "System can insert notifications" ON public.client_notifications;
CREATE POLICY "Service role can insert notifications"
ON public.client_notifications FOR INSERT TO service_role WITH CHECK (true);

-- 3. Lock down handwerker_notifications INSERT to service_role
DROP POLICY IF EXISTS "System can insert notifications" ON public.handwerker_notifications;
CREATE POLICY "Service role can insert handwerker notifications"
ON public.handwerker_notifications FOR INSERT TO service_role WITH CHECK (true);

-- 4. Lock down payment_history INSERT to service_role
DROP POLICY IF EXISTS "System can insert payment history" ON public.payment_history;
CREATE POLICY "Service role can insert payment history"
ON public.payment_history FOR INSERT TO service_role WITH CHECK (true);

-- 5. Drop password_reset_backup table (one-time backup no longer needed)
DROP TABLE IF EXISTS public.password_reset_backup_2026_04_17;
DROP FUNCTION IF EXISTS public.snapshot_user_password(uuid);

-- 6. Schedule magic_tokens cleanup (limit token exposure window)
CREATE EXTENSION IF NOT EXISTS pg_cron;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'delete-expired-magic-tokens-hourly') THEN
    PERFORM cron.schedule(
      'delete-expired-magic-tokens-hourly',
      '0 * * * *',
      $cron$ SELECT public.delete_expired_magic_tokens(); $cron$
    );
  END IF;
END $$;
