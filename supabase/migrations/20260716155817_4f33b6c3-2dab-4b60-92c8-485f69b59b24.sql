UPDATE public.handwerker_subscriptions
SET plan_type='monthly',
    proposals_limit=25,
    proposals_used_this_period=0,
    current_period_start='2026-07-16 12:24:56+00',
    current_period_end='2026-08-16 12:24:56+00',
    status='active',
    pending_plan=NULL,
    updated_at=now()
WHERE user_id='d95042d1-cfe2-4323-9712-197bb8403c25';

INSERT INTO public.handwerker_notifications (user_id, type, title, message, metadata)
VALUES ('d95042d1-cfe2-4323-9712-197bb8403c25',
        'subscription_activated',
        'Abonnement aktiviert',
        'Ihr monatliches-Abonnement wurde erfolgreich aktiviert.',
        jsonb_build_object('planType','monthly','source','manual-recovery'));