CREATE OR REPLACE FUNCTION public.run_retention_cleanup()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prt int; v_an int; v_hn int; v_cn int;
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

  PERFORM public.delete_expired_magic_tokens();
  PERFORM public.delete_expired_contact_requests();

  RETURN jsonb_build_object(
    'password_reset_tokens', v_prt,
    'admin_notifications',   v_an,
    'handwerker_notifications', v_hn,
    'client_notifications',  v_cn,
    'run_at', now()
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.run_retention_cleanup() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.run_retention_cleanup() TO service_role;