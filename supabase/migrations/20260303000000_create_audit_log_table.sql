-- Audit Log Table for Server-Side Observability
-- Tracks critical operations like proposal acceptance, status transitions, and payment events
-- Useful for debugging Ghost Lead scenarios and other transactional issues

CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,           -- e.g. 'proposal_accepted', 'status_transition_blocked'
  entity_type TEXT NOT NULL,      -- e.g. 'lead_proposal', 'lead'
  entity_id UUID,                 -- the affected row's ID
  actor_id UUID,                  -- who triggered it (null for system actions)
  metadata JSONB DEFAULT '{}',    -- flexible context (lead_id, rejected_count, error reason, etc.)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for querying by entity
CREATE INDEX idx_audit_log_entity ON public.audit_log (entity_type, entity_id);
-- Index for querying by time (admin dashboard / debugging)
CREATE INDEX idx_audit_log_created ON public.audit_log (created_at DESC);

-- RLS: only service_role can access
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON public.audit_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);
