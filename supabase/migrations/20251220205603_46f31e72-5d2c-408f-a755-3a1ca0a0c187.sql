-- Create deletion_audit table for tracking all user deletions
CREATE TABLE public.deletion_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deleted_user_id UUID,
  deleted_email TEXT NOT NULL,
  deleted_by UUID,
  deletion_type TEXT NOT NULL CHECK (deletion_type IN ('full', 'guest', 'partial')),
  deletion_stats JSONB DEFAULT '{}'::jsonb,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  verified_clean BOOLEAN DEFAULT false,
  orphaned_records JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add comment for documentation
COMMENT ON TABLE public.deletion_audit IS 'Tracks all user deletion attempts for audit and debugging purposes';
COMMENT ON COLUMN public.deletion_audit.deletion_type IS 'full = auth user + data, guest = guest registration only, partial = some data failed to delete';
COMMENT ON COLUMN public.deletion_audit.verified_clean IS 'True if post-deletion verification confirmed no orphaned records';
COMMENT ON COLUMN public.deletion_audit.orphaned_records IS 'Details of any orphaned records found during verification';

-- Enable RLS
ALTER TABLE public.deletion_audit ENABLE ROW LEVEL SECURITY;

-- Only admins can view deletion audit
CREATE POLICY "Admins can view deletion audit"
  ON public.deletion_audit
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

-- Allow edge functions to insert audit records
CREATE POLICY "System can insert deletion audit"
  ON public.deletion_audit
  FOR INSERT
  WITH CHECK (true);

-- Create index for common queries
CREATE INDEX idx_deletion_audit_email ON public.deletion_audit(deleted_email);
CREATE INDEX idx_deletion_audit_created_at ON public.deletion_audit(created_at DESC);
CREATE INDEX idx_deletion_audit_success ON public.deletion_audit(success);
CREATE INDEX idx_deletion_audit_verified_clean ON public.deletion_audit(verified_clean);