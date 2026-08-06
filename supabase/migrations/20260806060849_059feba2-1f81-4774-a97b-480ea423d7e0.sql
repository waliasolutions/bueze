CREATE TABLE public.app_error_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid,
  user_email text,
  context text NOT NULL DEFAULT 'unknown',
  category text NOT NULL DEFAULT 'unknown',
  severity text NOT NULL DEFAULT 'medium',
  message text NOT NULL,
  detail text,
  route text,
  user_agent text,
  correlation_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

GRANT INSERT ON public.app_error_log TO anon;
GRANT SELECT, INSERT ON public.app_error_log TO authenticated;
GRANT ALL ON public.app_error_log TO service_role;

ALTER TABLE public.app_error_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read error log"
  ON public.app_error_log
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  );

CREATE POLICY "Authenticated can log own errors"
  ON public.app_error_log
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Guests can log anonymous errors"
  ON public.app_error_log
  FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

CREATE INDEX idx_app_error_log_created_at ON public.app_error_log (created_at DESC);
CREATE INDEX idx_app_error_log_category_created_at ON public.app_error_log (category, created_at DESC);

CREATE OR REPLACE FUNCTION public.run_retention_cleanup()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_prt int; v_an int; v_hn int; v_cn int; v_ael int;
BEGIN
  DELETE FROM public.password_reset_tokens WHERE expires_at < now();
  GET DIAGNOSTICS v_prt = ROW_COUNT;

  DELETE FROM public.admin_notifications
    WHERE read = true AND created_at < now() - interval '90 days';
  GET DIAGNOSTICS v_an = ROW_COUNT;

  DELETE FROM public.handwerker_notifications
    WHERE read = true AND created_at < now() - interval '90 days';
  GET DIAGNOSTICS v_hn = ROW_COUNT;

  DELETE FROM public.client_notifications
    WHERE read = true AND created_at < now() - interval '90 days';
  GET DIAGNOSTICS v_cn = ROW_COUNT;

  DELETE FROM public.app_error_log
    WHERE created_at < now() - interval '90 days';
  GET DIAGNOSTICS v_ael = ROW_COUNT;

  PERFORM public.delete_expired_magic_tokens();
  PERFORM public.delete_expired_contact_requests();

  RETURN jsonb_build_object(
    'password_reset_tokens', v_prt,
    'admin_notifications',   v_an,
    'handwerker_notifications', v_hn,
    'client_notifications',  v_cn,
    'app_error_log',         v_ael,
    'run_at', now()
  );
END;
$function$;