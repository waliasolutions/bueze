
CREATE TABLE public.zefix_lookup_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  ip_hash text,
  action text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_zefix_lookup_log_user_time ON public.zefix_lookup_log (user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX idx_zefix_lookup_log_ip_time ON public.zefix_lookup_log (ip_hash, created_at DESC) WHERE ip_hash IS NOT NULL;
CREATE INDEX idx_zefix_lookup_log_cleanup ON public.zefix_lookup_log (created_at);

GRANT ALL ON public.zefix_lookup_log TO service_role;

ALTER TABLE public.zefix_lookup_log ENABLE ROW LEVEL SECURITY;

-- No policies for anon/authenticated: only service_role (edge functions) may read/write.

CREATE OR REPLACE FUNCTION public.check_zefix_rate_limit(
  p_user_id uuid,
  p_ip_hash text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_count int := 0;
  v_ip_count int := 0;
BEGIN
  IF p_user_id IS NOT NULL THEN
    SELECT count(*) INTO v_user_count
      FROM public.zefix_lookup_log
     WHERE user_id = p_user_id
       AND created_at > now() - interval '2 hours';
    IF v_user_count >= 10 THEN
      RETURN jsonb_build_object('allowed', false, 'reason', 'user', 'retry_after_minutes', 120);
    END IF;
  END IF;

  IF p_ip_hash IS NOT NULL THEN
    SELECT count(*) INTO v_ip_count
      FROM public.zefix_lookup_log
     WHERE ip_hash = p_ip_hash
       AND created_at > now() - interval '24 hours';
    IF v_ip_count >= 100 THEN
      RETURN jsonb_build_object('allowed', false, 'reason', 'ip', 'retry_after_minutes', 1440);
    END IF;
  END IF;

  RETURN jsonb_build_object('allowed', true, 'user_count', v_user_count, 'ip_count', v_ip_count);
END;
$$;

CREATE OR REPLACE FUNCTION public.record_zefix_lookup(
  p_user_id uuid,
  p_ip_hash text,
  p_action text
) RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.zefix_lookup_log (user_id, ip_hash, action)
  VALUES (p_user_id, p_ip_hash, p_action);
  -- opportunistic cleanup of rows older than 7 days
  DELETE FROM public.zefix_lookup_log WHERE created_at < now() - interval '7 days';
$$;

REVOKE EXECUTE ON FUNCTION public.check_zefix_rate_limit(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.record_zefix_lookup(uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_zefix_rate_limit(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_zefix_lookup(uuid, text, text) TO service_role;
