-- 1) handwerker_profiles: drop anon read of pending guest registrations
DROP POLICY IF EXISTS "Allow anon to read pending guest registrations" ON public.handwerker_profiles;

-- 2) subscriptions: remove user write access (legacy table, no client writes)
DROP POLICY IF EXISTS "Users can manage own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription" ON public.subscriptions;

-- 3) handwerker_subscriptions: block self-escalation via trigger
CREATE OR REPLACE FUNCTION public.prevent_subscription_self_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_privileged boolean := false;
BEGIN
  -- Service role and admins may change anything
  IF auth.role() = 'service_role' THEN
    is_privileged := true;
  ELSIF auth.uid() IS NOT NULL AND (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'super_admin'::app_role)
  ) THEN
    is_privileged := true;
  END IF;

  IF is_privileged THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- Force safe defaults for self-created rows. Only the free baseline
    -- and a pending_plan intent are allowed; the rest is set by webhooks.
    NEW.plan_type := 'free';
    NEW.proposals_limit := 5;
    NEW.proposals_used_this_period := COALESCE(NEW.proposals_used_this_period, 0);
    NEW.status := 'active';
    NEW.stripe_subscription_id := NULL;
    NEW.stripe_customer_id := NULL;
    NEW.payrexx_subscription_id := NULL;
    NEW.auto_renew := COALESCE(NEW.auto_renew, false);
    NEW.payment_reminder_1_sent := false;
    NEW.payment_reminder_2_sent := false;
    NEW.renewal_reminder_sent := false;
    RETURN NEW;
  END IF;

  -- UPDATE: keep all sensitive columns at their previous values
  NEW.plan_type := OLD.plan_type;
  NEW.proposals_limit := OLD.proposals_limit;
  NEW.proposals_used_this_period := OLD.proposals_used_this_period;
  NEW.status := OLD.status;
  NEW.stripe_subscription_id := OLD.stripe_subscription_id;
  NEW.stripe_customer_id := OLD.stripe_customer_id;
  NEW.payrexx_subscription_id := OLD.payrexx_subscription_id;
  NEW.current_period_start := OLD.current_period_start;
  NEW.current_period_end := OLD.current_period_end;
  NEW.payment_reminder_1_sent := OLD.payment_reminder_1_sent;
  NEW.payment_reminder_2_sent := OLD.payment_reminder_2_sent;
  NEW.renewal_reminder_sent := OLD.renewal_reminder_sent;
  -- user_id immutable
  NEW.user_id := OLD.user_id;
  -- pending_plan and auto_renew remain user-editable (intent only)
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_subscription_self_escalation_trg ON public.handwerker_subscriptions;
CREATE TRIGGER prevent_subscription_self_escalation_trg
BEFORE INSERT OR UPDATE ON public.handwerker_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.prevent_subscription_self_escalation();

-- 4) billing_settings: restrict full read to admins (regular users use billing_settings_public view)
DROP POLICY IF EXISTS "Authenticated can read billing settings" ON public.billing_settings;
CREATE POLICY "Admins can read billing settings"
ON public.billing_settings
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));