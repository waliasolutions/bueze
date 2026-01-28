-- Create password_reset_tokens table for custom password reset flow
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '1 hour'),
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast token lookup
CREATE INDEX idx_password_reset_tokens_token ON public.password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_expires ON public.password_reset_tokens(expires_at);

-- RLS policies
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Only edge functions with service role can access this table
CREATE POLICY "No direct access to password_reset_tokens"
  ON public.password_reset_tokens FOR ALL
  USING (false);