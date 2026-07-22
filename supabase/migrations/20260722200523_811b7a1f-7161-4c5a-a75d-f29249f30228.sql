CREATE INDEX IF NOT EXISTS idx_leads_status_created_at
  ON public.leads (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_handwerker_profiles_created_at
  ON public.handwerker_profiles (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_handwerker_profiles_verification_created
  ON public.handwerker_profiles (verification_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_roles_role
  ON public.user_roles (role);