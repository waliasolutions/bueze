ALTER TABLE handwerker_subscriptions
  ADD COLUMN IF NOT EXISTS auto_renew boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS payrexx_subscription_id text;