INSERT INTO public.payment_history (
  user_id, amount, currency, plan_type, status,
  payment_provider, payrexx_transaction_id, payment_date, description
) VALUES (
  'd95042d1-cfe2-4323-9712-197bb8403c25',
  9000, 'CHF', 'monthly', 'paid',
  'payrexx', 'manual-recovery-c8105ec3-2026-07-16',
  '2026-07-16 14:24:56+02',
  'Büeze monthly Abonnement (manuelle Nacherfassung Payrexx-Zahlung)'
)
ON CONFLICT (payrexx_transaction_id) WHERE payrexx_transaction_id IS NOT NULL DO NOTHING;

UPDATE public.handwerker_subscriptions
SET plan_type = 'monthly',
    status = 'active',
    proposals_limit = -1,
    proposals_used_this_period = 0,
    current_period_start = '2026-07-16 14:24:56+02',
    current_period_end = ('2026-07-16 14:24:56+02'::timestamptz + interval '1 month'),
    pending_plan = NULL,
    renewal_reminder_sent = false,
    payment_reminder_1_sent = false,
    payment_reminder_2_sent = false,
    updated_at = now()
WHERE user_id = 'd95042d1-cfe2-4323-9712-197bb8403c25';