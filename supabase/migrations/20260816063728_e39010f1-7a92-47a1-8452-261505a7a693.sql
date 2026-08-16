CREATE TABLE public.email_send_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dedupe_key text NOT NULL,
  recipient text NOT NULL,
  bcc text,
  subject text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  context text,
  smtp2go_email_id text,
  error_detail text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX email_send_log_dedupe_key_uidx ON public.email_send_log (dedupe_key);
CREATE INDEX email_send_log_created_at_idx ON public.email_send_log (created_at DESC);
CREATE INDEX email_send_log_recipient_idx ON public.email_send_log (recipient);

GRANT SELECT ON public.email_send_log TO authenticated;
GRANT ALL ON public.email_send_log TO service_role;

ALTER TABLE public.email_send_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view email send log"
ON public.email_send_log
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER update_email_send_log_updated_at
BEFORE UPDATE ON public.email_send_log
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.run_retention_cleanup()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_prt int; v_an int; v_hn int; v_cn int; v_ael int; v_esl int;
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

  DELETE FROM public.email_send_log
    WHERE created_at < now() - interval '180 days';
  GET DIAGNOSTICS v_esl = ROW_COUNT;

  PERFORM public.delete_expired_magic_tokens();
  PERFORM public.delete_expired_contact_requests();

  RETURN jsonb_build_object(
    'password_reset_tokens', v_prt,
    'admin_notifications',   v_an,
    'handwerker_notifications', v_hn,
    'client_notifications',  v_cn,
    'app_error_log',         v_ael,
    'email_send_log',        v_esl,
    'run_at', now()
  );
END;
$function$;