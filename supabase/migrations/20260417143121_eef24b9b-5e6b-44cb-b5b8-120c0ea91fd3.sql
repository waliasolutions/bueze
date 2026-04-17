-- Snapshot a user's current encrypted_password into the backup table.
-- SECURITY DEFINER because auth.users is not directly readable via PostgREST.
-- Idempotent: re-running for the same user_id is a no-op (PRIMARY KEY conflict).
CREATE OR REPLACE FUNCTION public.snapshot_user_password(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  INSERT INTO public.password_reset_backup_2026_04_17 (user_id, email, old_encrypted_password, old_updated_at)
  SELECT u.id, u.email, u.encrypted_password, u.updated_at
  FROM auth.users u
  WHERE u.id = p_user_id
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

-- Lock down: only the service role (used by edge functions) may call this.
REVOKE EXECUTE ON FUNCTION public.snapshot_user_password(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.snapshot_user_password(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.snapshot_user_password(uuid) FROM anon;

COMMENT ON FUNCTION public.snapshot_user_password(uuid) IS
  'One-time helper for the 2026-04-17 bulk password reset. Copies auth.users.encrypted_password into password_reset_backup_2026_04_17 before the reset overwrites it. Service-role only.';