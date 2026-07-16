
-- Fix Gabor's subscription: he paid CHF 90 for monthly plan but his subscription
-- row was never upgraded from free. Use the actual payment date as period start.
UPDATE public.handwerker_subscriptions hs
SET plan_type = 'monthly',
    status = 'active',
    proposals_limit = -1,
    proposals_used_this_period = 0,
    current_period_start = '2026-07-16 12:24:56+00'::timestamptz,
    current_period_end = '2026-08-16 12:24:56+00'::timestamptz,
    pending_plan = NULL,
    payment_reminder_1_sent = false,
    payment_reminder_2_sent = false,
    renewal_reminder_sent = false,
    updated_at = now()
FROM public.profiles p
WHERE p.id = hs.user_id
  AND p.email = 'info@romeoprofidach.com';
