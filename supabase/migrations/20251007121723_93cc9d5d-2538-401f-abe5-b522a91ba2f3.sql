-- Phase 2: Database Schema Updates for Subscription System

-- 1. Update subscription_plan enum with new values
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'free' AND enumtypid = 'subscription_plan'::regtype) THEN
    ALTER TYPE subscription_plan ADD VALUE 'free';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'monthly' AND enumtypid = 'subscription_plan'::regtype) THEN
    ALTER TYPE subscription_plan ADD VALUE 'monthly';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = '6_month' AND enumtypid = 'subscription_plan'::regtype) THEN
    ALTER TYPE subscription_plan ADD VALUE '6_month';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'annual' AND enumtypid = 'subscription_plan'::regtype) THEN
    ALTER TYPE subscription_plan ADD VALUE 'annual';
  END IF;
END $$;

-- 2. Add new columns to subscriptions table
ALTER TABLE public.subscriptions 
  ADD COLUMN IF NOT EXISTS billing_cycle text CHECK (billing_cycle IN ('monthly', '6_month', 'annual')),
  ADD COLUMN IF NOT EXISTS used_views integer DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS max_views integer DEFAULT 2 NOT NULL;

-- 3. Create lead_views table for tracking lead views
CREATE TABLE IF NOT EXISTS public.lead_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  viewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(lead_id, viewer_id)
);

-- Enable RLS on lead_views
ALTER TABLE public.lead_views ENABLE ROW LEVEL SECURITY;

-- RLS policies for lead_views
CREATE POLICY "Users can view own lead views"
  ON public.lead_views FOR SELECT
  USING (auth.uid() = viewer_id);

CREATE POLICY "Users can create lead views"
  ON public.lead_views FOR INSERT
  WITH CHECK (auth.uid() = viewer_id);

-- 4. Update lead_status enum to include 'paused', 'completed', 'deleted'
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'paused' AND enumtypid = 'lead_status'::regtype) THEN
    ALTER TYPE lead_status ADD VALUE 'paused';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'completed' AND enumtypid = 'lead_status'::regtype) THEN
    ALTER TYPE lead_status ADD VALUE 'completed';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'deleted' AND enumtypid = 'lead_status'::regtype) THEN
    ALTER TYPE lead_status ADD VALUE 'deleted';
  END IF;
END $$;

-- 5. Update RLS policies for leads to support new statuses
DROP POLICY IF EXISTS "Anyone can view active leads" ON public.leads;
DROP POLICY IF EXISTS "Lead owners can manage own leads" ON public.leads;

CREATE POLICY "Users can view active leads or own leads"
  ON public.leads FOR SELECT
  USING (
    status = 'active' OR 
    auth.uid() = owner_id
  );

CREATE POLICY "Lead owners can manage own leads"
  ON public.leads FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- 6. Add unique constraint to prevent duplicate lead purchases
CREATE UNIQUE INDEX IF NOT EXISTS unique_lead_purchase 
  ON public.lead_purchases(lead_id, buyer_id);

-- 7. Create indexes on lead_views for better query performance
CREATE INDEX IF NOT EXISTS idx_lead_views_viewer_id ON public.lead_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_lead_views_lead_id ON public.lead_views(lead_id);