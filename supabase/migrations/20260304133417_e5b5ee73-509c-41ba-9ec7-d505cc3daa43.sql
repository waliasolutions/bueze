ALTER TABLE handwerker_subscriptions 
ADD COLUMN IF NOT EXISTS renewal_reminder_sent BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_subs_expiry_logic 
ON handwerker_subscriptions (current_period_end, pending_plan, renewal_reminder_sent);