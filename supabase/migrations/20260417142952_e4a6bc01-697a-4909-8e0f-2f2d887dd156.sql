-- Backup table for bulk password reset (rollback safety net)
CREATE TABLE public.password_reset_backup_2026_04_17 (
  user_id uuid PRIMARY KEY,
  email text NOT NULL,
  old_encrypted_password text NOT NULL,
  old_updated_at timestamptz NOT NULL,
  backed_up_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.password_reset_backup_2026_04_17 ENABLE ROW LEVEL SECURITY;

-- Only super_admin can access (read or write) the backup table
CREATE POLICY "Only super_admin can access password reset backup"
ON public.password_reset_backup_2026_04_17
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

COMMENT ON TABLE public.password_reset_backup_2026_04_17 IS 
  'Snapshot of auth.users.encrypted_password before bulk password reset on 2026-04-17. Allows manual rollback via UPDATE auth.users SET encrypted_password = b.old_encrypted_password FROM password_reset_backup_2026_04_17 b WHERE auth.users.id = b.user_id.';