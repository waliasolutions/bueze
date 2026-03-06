-- Add Payrexx subscription tracking to handwerker_subscriptions
-- Supports Payrexx-managed recurring subscriptions with opt-in auto-renewal

ALTER TABLE handwerker_subscriptions
  ADD COLUMN IF NOT EXISTS payrexx_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT false;

-- Index for looking up by Payrexx subscription ID
CREATE INDEX IF NOT EXISTS idx_subscriptions_payrexx_sub_id
  ON handwerker_subscriptions (payrexx_subscription_id)
  WHERE payrexx_subscription_id IS NOT NULL;
