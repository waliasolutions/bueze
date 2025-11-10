-- Create subscriptions table for handwerker subscription management
CREATE TABLE IF NOT EXISTS public.handwerker_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'monthly', '6_month', 'annual')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'past_due')),
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '1 month'),
  proposals_used_this_period INTEGER NOT NULL DEFAULT 0,
  proposals_limit INTEGER NOT NULL DEFAULT 5, -- -1 for unlimited
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.handwerker_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own subscription"
  ON public.handwerker_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription"
  ON public.handwerker_subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON public.handwerker_subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions"
  ON public.handwerker_subscriptions
  FOR SELECT
  USING (get_user_role(auth.uid()) = 'admin'::app_role);

CREATE POLICY "Admins can manage all subscriptions"
  ON public.handwerker_subscriptions
  FOR ALL
  USING (get_user_role(auth.uid()) = 'admin'::app_role);

-- Function to check if handwerker can submit proposal
CREATE OR REPLACE FUNCTION public.can_submit_proposal(handwerker_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sub_record RECORD;
BEGIN
  -- Get or create subscription record
  SELECT * INTO sub_record
  FROM handwerker_subscriptions
  WHERE user_id = handwerker_user_id;
  
  -- If no subscription exists, create free tier
  IF NOT FOUND THEN
    INSERT INTO handwerker_subscriptions (user_id, plan_type, proposals_limit)
    VALUES (handwerker_user_id, 'free', 5)
    RETURNING * INTO sub_record;
  END IF;
  
  -- Check if period has expired and reset if needed
  IF sub_record.current_period_end < NOW() THEN
    UPDATE handwerker_subscriptions
    SET 
      proposals_used_this_period = 0,
      current_period_start = NOW(),
      current_period_end = NOW() + INTERVAL '1 month'
    WHERE user_id = handwerker_user_id;
    RETURN TRUE;
  END IF;
  
  -- Check if unlimited (-1) or under limit
  IF sub_record.proposals_limit = -1 THEN
    RETURN TRUE;
  END IF;
  
  RETURN sub_record.proposals_used_this_period < sub_record.proposals_limit;
END;
$$;

-- Function to increment proposal count
CREATE OR REPLACE FUNCTION public.increment_proposal_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Increment proposal count for handwerker
  INSERT INTO handwerker_subscriptions (user_id, proposals_used_this_period, plan_type, proposals_limit)
  VALUES (NEW.handwerker_id, 1, 'free', 5)
  ON CONFLICT (user_id) 
  DO UPDATE SET proposals_used_this_period = handwerker_subscriptions.proposals_used_this_period + 1;
  
  RETURN NEW;
END;
$$;

-- Trigger to increment count when proposal is created
CREATE TRIGGER increment_proposal_count_trigger
  AFTER INSERT ON public.lead_proposals
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_proposal_count();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_handwerker_subscriptions_user_id ON public.handwerker_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_handwerker_subscriptions_status ON public.handwerker_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_lead_proposals_handwerker_status ON public.lead_proposals(handwerker_id, status);
CREATE INDEX IF NOT EXISTS idx_lead_proposals_lead_status ON public.lead_proposals(lead_id, status);