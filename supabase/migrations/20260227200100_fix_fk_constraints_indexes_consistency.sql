-- Fix: Add missing FK constraints on conversations and handwerker_documents tables
-- Also add performance indexes for RLS subquery columns

-- 1. conversations.homeowner_id FK (was missing in migration 20250920201949)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'conversations_homeowner_id_fkey'
    AND table_name = 'conversations'
  ) THEN
    ALTER TABLE public.conversations
      ADD CONSTRAINT conversations_homeowner_id_fkey
      FOREIGN KEY (homeowner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 2. conversations.handwerker_id FK (was missing in migration 20250920201949)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'conversations_handwerker_id_fkey'
    AND table_name = 'conversations'
  ) THEN
    ALTER TABLE public.conversations
      ADD CONSTRAINT conversations_handwerker_id_fkey
      FOREIGN KEY (handwerker_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 3. handwerker_documents.user_id FK (was plain UUID without reference)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'handwerker_documents_user_id_fkey'
    AND table_name = 'handwerker_documents'
  ) THEN
    ALTER TABLE public.handwerker_documents
      ADD CONSTRAINT handwerker_documents_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 4. Performance indexes for RLS subquery columns
CREATE INDEX IF NOT EXISTS idx_leads_owner_id ON public.leads(owner_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_status_created ON public.leads(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_handwerker_profiles_user_id ON public.handwerker_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_proposals_lead_id ON public.lead_proposals(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_proposals_handwerker_id ON public.lead_proposals(handwerker_id);
CREATE INDEX IF NOT EXISTS idx_lead_proposals_status ON public.lead_proposals(status);
CREATE INDEX IF NOT EXISTS idx_conversations_homeowner_id ON public.conversations(homeowner_id);
CREATE INDEX IF NOT EXISTS idx_conversations_handwerker_id ON public.conversations(handwerker_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_reviews_lead_id ON public.reviews(lead_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed_id ON public.reviews(reviewed_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_handwerker_subscriptions_user_id ON public.handwerker_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_user_id ON public.payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_handwerker_documents_user_id ON public.handwerker_documents(user_id);

-- 5. Lead status consistency trigger: ensure accepted_proposal_id is only set on completed leads
CREATE OR REPLACE FUNCTION enforce_lead_status_consistency()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting accepted_proposal_id, status must be 'completed'
  IF NEW.accepted_proposal_id IS NOT NULL AND NEW.status != 'completed' THEN
    NEW.status := 'completed';
  END IF;
  -- If clearing accepted_proposal_id, status should not be 'completed'
  IF NEW.accepted_proposal_id IS NULL AND NEW.status = 'completed' AND OLD.accepted_proposal_id IS NOT NULL THEN
    NEW.status := 'active';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS lead_status_consistency_trigger ON public.leads;
CREATE TRIGGER lead_status_consistency_trigger
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION enforce_lead_status_consistency();
