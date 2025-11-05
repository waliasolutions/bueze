-- ====================================================
-- Phase 1: Create Core Tables
-- ====================================================

-- Create subscriptions table (for quota tracking)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('free', 'basic', 'premium')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled')),
  proposals_limit INTEGER,
  used_proposals INTEGER DEFAULT 0,
  proposals_reset_at TIMESTAMPTZ DEFAULT DATE_TRUNC('month', NOW() + INTERVAL '1 month'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, plan)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_active ON public.subscriptions(user_id) WHERE status = 'active';

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can manage own subscriptions" ON public.subscriptions
  FOR ALL TO authenticated USING (user_id = auth.uid());

-- Create magic_tokens table
CREATE TABLE public.magic_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('lead', 'proposal', 'dashboard', 'conversation')),
  resource_id UUID,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_magic_tokens_token ON public.magic_tokens(token) WHERE used_at IS NULL;
CREATE INDEX idx_magic_tokens_expires ON public.magic_tokens(expires_at) WHERE used_at IS NULL;
CREATE INDEX idx_magic_tokens_user_id ON public.magic_tokens(user_id);

ALTER TABLE public.magic_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage magic tokens" ON public.magic_tokens
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Function to auto-delete expired tokens
CREATE OR REPLACE FUNCTION public.delete_expired_magic_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.magic_tokens 
  WHERE expires_at < NOW() 
  OR (used_at IS NOT NULL AND used_at < NOW() - INTERVAL '7 days');
END;
$$;

-- Create proposal status enum
DO $$ BEGIN
  CREATE TYPE public.proposal_status AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create lead_proposals table
CREATE TABLE public.lead_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  handwerker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  price_min INTEGER NOT NULL CHECK (price_min >= 0),
  price_max INTEGER NOT NULL CHECK (price_max >= price_min),
  estimated_duration_days INTEGER CHECK (estimated_duration_days > 0),
  message TEXT NOT NULL CHECK (LENGTH(message) >= 50 AND LENGTH(message) <= 2000),
  attachments TEXT[] DEFAULT '{}',
  status public.proposal_status DEFAULT 'pending' NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  responded_at TIMESTAMPTZ,
  client_viewed_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(lead_id, handwerker_id)
);

CREATE INDEX idx_proposals_lead_id ON public.lead_proposals(lead_id);
CREATE INDEX idx_proposals_handwerker_id ON public.lead_proposals(handwerker_id);
CREATE INDEX idx_proposals_status ON public.lead_proposals(status);
CREATE INDEX idx_proposals_submitted_at ON public.lead_proposals(submitted_at);

ALTER TABLE public.lead_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Handwerkers can view own proposals" ON public.lead_proposals
  FOR SELECT TO authenticated USING (handwerker_id = auth.uid());

CREATE POLICY "Lead owners can view proposals for their leads" ON public.lead_proposals
  FOR SELECT TO authenticated USING (lead_id IN (
    SELECT id FROM public.leads WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Handwerkers can create proposals" ON public.lead_proposals
  FOR INSERT TO authenticated WITH CHECK (
    handwerker_id = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM public.handwerker_profiles 
      WHERE user_id = auth.uid() 
      AND verification_status = 'approved'
    )
  );

CREATE POLICY "Handwerkers can update own pending proposals" ON public.lead_proposals
  FOR UPDATE TO authenticated 
  USING (handwerker_id = auth.uid() AND status = 'pending')
  WITH CHECK (handwerker_id = auth.uid() AND status IN ('pending', 'withdrawn'));

CREATE POLICY "Lead owners can update proposals for their leads" ON public.lead_proposals
  FOR UPDATE TO authenticated 
  USING (lead_id IN (SELECT id FROM public.leads WHERE owner_id = auth.uid()))
  WITH CHECK (status IN ('accepted', 'rejected'));

-- Add proposal tracking to leads
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS proposal_deadline TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS proposals_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS accepted_proposal_id UUID REFERENCES public.lead_proposals(id);

CREATE INDEX IF NOT EXISTS idx_leads_proposal_deadline ON public.leads(proposal_deadline) WHERE status = 'active';

-- Update existing active leads to set deadline
UPDATE public.leads 
SET proposal_deadline = created_at + INTERVAL '10 days'
WHERE status = 'active' AND proposal_deadline IS NULL;

-- ====================================================
-- Phase 2: Enable Extensions
-- ====================================================

CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ====================================================
-- Phase 3: Create Trigger Functions
-- ====================================================

-- Trigger: Send lead notification when lead becomes active
CREATE OR REPLACE FUNCTION public.trigger_send_lead_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'active' AND (OLD.status IS NULL OR OLD.status != 'active') THEN
    IF NEW.proposal_deadline IS NULL THEN
      NEW.proposal_deadline := NEW.created_at + INTERVAL '10 days';
    END IF;

    PERFORM net.http_post(
      url := 'https://ztthhdlhuhtwaaennfia.supabase.co/functions/v1/send-lead-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0dGhoZGxodWh0d2FhZW5uZmlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNDg2NzYsImV4cCI6MjA2NDYyNDY3Nn0.4_aty-J0w_eHsP9sTid0yID7ZNJhd1HGvLf8OJY1A8A'
      ),
      body := jsonb_build_object('leadId', NEW.id::text)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_lead_active_send_notification ON public.leads;
CREATE TRIGGER on_lead_active_send_notification
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION trigger_send_lead_notification();

-- Trigger: Send proposal notification when proposal is created
CREATE OR REPLACE FUNCTION public.trigger_send_proposal_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.leads
  SET proposals_count = proposals_count + 1
  WHERE id = NEW.lead_id;

  PERFORM net.http_post(
    url := 'https://ztthhdlhuhtwaaennfia.supabase.co/functions/v1/send-proposal-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0dGhoZGxodWh0d2FhZW5uZmlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNDg2NzYsImV4cCI6MjA2NDYyNDY3Nn0.4_aty-J0w_eHsP9sTid0yID7ZNJhd1HGvLf8OJY1A8A'
    ),
    body := jsonb_build_object('proposalId', NEW.id::text)
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_proposal_created_send_notification ON public.lead_proposals;
CREATE TRIGGER on_proposal_created_send_notification
  AFTER INSERT ON public.lead_proposals
  FOR EACH ROW
  EXECUTE FUNCTION trigger_send_proposal_notification();

-- Trigger: Send acceptance emails when proposal is accepted
CREATE OR REPLACE FUNCTION public.trigger_send_acceptance_emails()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    PERFORM net.http_post(
      url := 'https://ztthhdlhuhtwaaennfia.supabase.co/functions/v1/send-acceptance-emails',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0dGhoZGxodWh0d2FhZW5uZmlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNDg2NzYsImV4cCI6MjA2NDYyNDY3Nn0.4_aty-J0w_eHsP9sTid0yID7ZNJhd1HGvLf8OJY1A8A'
      ),
      body := jsonb_build_object('proposalId', NEW.id::text)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_proposal_accepted_send_emails ON public.lead_proposals;
CREATE TRIGGER on_proposal_accepted_send_emails
  AFTER UPDATE ON public.lead_proposals
  FOR EACH ROW
  EXECUTE FUNCTION trigger_send_acceptance_emails();

-- ====================================================
-- Phase 4: Schedule Cron Jobs
-- ====================================================

-- Daily proposal deadline reminders at 9:00 AM
SELECT cron.schedule(
  'proposal-deadline-reminders',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://ztthhdlhuhtwaaennfia.supabase.co/functions/v1/proposal-deadline-reminder',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0dGhoZGxodWh0d2FhZW5uZmlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNDg2NzYsImV4cCI6MjA2NDYyNDY3Nn0.4_aty-J0w_eHsP9sTid0yID7ZNJhd1HGvLf8OJY1A8A'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Monthly quota reset on first day at 00:01
SELECT cron.schedule(
  'reset-monthly-proposal-quotas',
  '1 0 1 * *',
  $$
  UPDATE public.subscriptions 
  SET 
    used_proposals = 0,
    proposals_reset_at = NOW()
  WHERE plan = 'free' AND status = 'active';
  $$
);