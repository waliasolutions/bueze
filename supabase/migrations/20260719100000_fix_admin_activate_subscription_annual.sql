
-- Fix admin_activate_subscription: the annual plan could never be activated.
-- The previous version only knew 'yearly', which (a) is rejected nowhere else
-- in the system ('annual' is the canonical value used by the frontend,
-- planLabels.ts and the referenceId format) and (b) would violate the
-- handwerker_subscriptions plan_type CHECK constraint
-- ('free','monthly','6_month','annual') if it ever got written.
-- 'yearly' is kept as an input alias but is normalized to 'annual' before
-- touching the table.
CREATE OR REPLACE FUNCTION public.admin_activate_subscription(
  p_user_id uuid,
  p_plan_type text,
  p_transaction_id text,
  p_amount integer DEFAULT NULL,
  p_period_start timestamptz DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_plan text := CASE WHEN p_plan_type = 'yearly' THEN 'annual' ELSE p_plan_type END;
  v_start timestamptz := COALESCE(p_period_start, now());
  v_months int;
  v_limit int;
  v_end timestamptz;
  v_updated int;
BEGIN
  -- AuthN/AuthZ: only real admins may call this.
  IF v_caller IS NULL
     OR NOT (has_role(v_caller, 'admin'::app_role)
             OR has_role(v_caller, 'super_admin'::app_role)) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  -- Plan config (kept in sync with _shared/planLabels.ts)
  IF v_plan = 'monthly' THEN
    v_months := 1; v_limit := -1;
  ELSIF v_plan = '6_month' THEN
    v_months := 6; v_limit := -1;
  ELSIF v_plan = 'annual' THEN
    v_months := 12; v_limit := -1;
  ELSE
    RAISE EXCEPTION 'unknown plan_type: %', p_plan_type;
  END IF;

  v_end := v_start + (v_months || ' months')::interval;

  -- Bypass prevent_subscription_self_escalation for this transaction only.
  PERFORM set_config('session_replication_role', 'replica', true);

  INSERT INTO public.handwerker_subscriptions (
    user_id, plan_type, status, proposals_limit, proposals_used_this_period,
    current_period_start, current_period_end, pending_plan,
    payment_reminder_1_sent, payment_reminder_2_sent, renewal_reminder_sent,
    updated_at
  ) VALUES (
    p_user_id, v_plan, 'active', v_limit, 0,
    v_start, v_end, NULL, false, false, false, now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    plan_type = EXCLUDED.plan_type,
    status = 'active',
    proposals_limit = EXCLUDED.proposals_limit,
    proposals_used_this_period = 0,
    current_period_start = EXCLUDED.current_period_start,
    current_period_end = EXCLUDED.current_period_end,
    pending_plan = NULL,
    payment_reminder_1_sent = false,
    payment_reminder_2_sent = false,
    renewal_reminder_sent = false,
    updated_at = now();

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  PERFORM set_config('session_replication_role', 'origin', true);

  -- Verify persistence — the whole reason this helper exists.
  IF NOT EXISTS (
    SELECT 1 FROM public.handwerker_subscriptions
    WHERE user_id = p_user_id
      AND plan_type = v_plan
      AND status = 'active'
      AND current_period_end = v_end
  ) THEN
    RAISE EXCEPTION 'subscription activation did not persist for user %', p_user_id;
  END IF;

  -- Audit trail
  INSERT INTO public.admin_audit_log (admin_id, action, target_id, details)
  VALUES (
    v_caller,
    'manual_subscription_activation',
    p_user_id,
    jsonb_build_object(
      'plan_type', v_plan,
      'transaction_id', p_transaction_id,
      'amount', p_amount,
      'period_start', v_start,
      'period_end', v_end
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'plan_type', v_plan,
    'period_start', v_start,
    'period_end', v_end,
    'rows_affected', v_updated
  );
END;
$$;

-- Only admins call this; anon/authenticated must not have execute.
REVOKE ALL ON FUNCTION public.admin_activate_subscription(uuid, text, text, integer, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_activate_subscription(uuid, text, text, integer, timestamptz) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_activate_subscription(uuid, text, text, integer, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_activate_subscription(uuid, text, text, integer, timestamptz) TO service_role;
