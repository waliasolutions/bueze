
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
SET search_path TO 'public'
AS $function$
DECLARE
  v_caller uuid := auth.uid();
  v_start timestamptz := COALESCE(p_period_start, now());
  v_months int;
  v_limit int;
  v_end timestamptz;
  v_payment_id uuid;
  v_project_url text;
  v_service_key text;
BEGIN
  IF v_caller IS NULL
     OR NOT (has_role(v_caller, 'admin'::app_role)
             OR has_role(v_caller, 'super_admin'::app_role)) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  IF p_plan_type = 'monthly' THEN
    v_months := 1; v_limit := -1;
  ELSIF p_plan_type = '6_month' THEN
    v_months := 6; v_limit := -1;
  ELSIF p_plan_type = 'yearly' THEN
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
    p_user_id, p_plan_type, 'active', v_limit, 0,
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

  PERFORM set_config('session_replication_role', 'origin', true);

  IF NOT EXISTS (
    SELECT 1 FROM public.handwerker_subscriptions
    WHERE user_id = p_user_id
      AND plan_type = p_plan_type
      AND status = 'active'
      AND current_period_end = v_end
  ) THEN
    RAISE EXCEPTION 'subscription activation did not persist for user %', p_user_id;
  END IF;

  -- Idempotent payment_history row (unique on payrexx_transaction_id).
  INSERT INTO public.payment_history (
    user_id, amount, currency, plan_type, status, payment_provider,
    payrexx_transaction_id, payment_date, description
  ) VALUES (
    p_user_id,
    p_amount,
    'CHF',
    p_plan_type,
    'paid',
    'payrexx',
    p_transaction_id,
    v_start,
    'Büeze ' || p_plan_type || ' Abonnement (manuelle Aktivierung durch Admin)'
  )
  ON CONFLICT (payrexx_transaction_id) DO NOTHING
  RETURNING id INTO v_payment_id;

  IF v_payment_id IS NULL THEN
    SELECT id INTO v_payment_id
      FROM public.payment_history
     WHERE payrexx_transaction_id = p_transaction_id
     LIMIT 1;
  END IF;

  -- Best-effort side-effects via pg_net (never block the activation).
  v_project_url := 'https://ztthhdlhuhtwaaennfia.supabase.co';
  v_service_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0dGhoZGxodWh0d2FhZW5uZmlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNDg2NzYsImV4cCI6MjA2NDYyNDY3Nn0.4_aty-J0w_eHsP9sTid0yID7ZNJhd1HGvLf8OJY1A8A';

  BEGIN
    PERFORM net.http_post(
      url := v_project_url || '/functions/v1/send-subscription-confirmation',
      headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || v_service_key),
      body := jsonb_build_object('userId', p_user_id, 'planType', p_plan_type)
    );
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  IF v_payment_id IS NOT NULL THEN
    BEGIN
      PERFORM net.http_post(
        url := v_project_url || '/functions/v1/generate-invoice-pdf',
        headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || v_service_key),
        body := jsonb_build_object('paymentId', v_payment_id, 'userId', p_user_id, 'planType', p_plan_type, 'amount', p_amount)
      );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;

  -- In-app notification for the user (mirrors payrexxActivation.ts)
  INSERT INTO public.handwerker_notifications (user_id, type, title, message, metadata)
  VALUES (
    p_user_id,
    'subscription_activated',
    'Abonnement aktiviert',
    'Ihr ' || p_plan_type || '-Abonnement wurde erfolgreich aktiviert.',
    jsonb_build_object('planType', p_plan_type, 'transactionId', p_transaction_id, 'source', 'admin_manual')
  );

  -- Audit trail (correct columns: admin_user_id + details JSONB carries target_id).
  INSERT INTO public.admin_audit_log (admin_user_id, action, details)
  VALUES (
    v_caller,
    'manual_subscription_activation',
    jsonb_build_object(
      'target_user_id', p_user_id,
      'plan_type', p_plan_type,
      'transaction_id', p_transaction_id,
      'amount', p_amount,
      'period_start', v_start,
      'period_end', v_end,
      'payment_id', v_payment_id
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'plan_type', p_plan_type,
    'period_start', v_start,
    'period_end', v_end,
    'payment_id', v_payment_id
  );
END;
$function$;
