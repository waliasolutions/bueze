-- Add pending_plan column to handwerker_subscriptions
-- Stores the user's desired plan before they are approved and pay
ALTER TABLE handwerker_subscriptions
ADD COLUMN pending_plan text DEFAULT NULL;