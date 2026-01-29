-- Add payment reminder tracking columns to handwerker_subscriptions
ALTER TABLE public.handwerker_subscriptions
ADD COLUMN IF NOT EXISTS payment_reminder_1_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS payment_reminder_2_sent BOOLEAN DEFAULT FALSE;