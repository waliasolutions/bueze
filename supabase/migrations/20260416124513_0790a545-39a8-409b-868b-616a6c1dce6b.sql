ALTER TABLE public.invoices
  DROP CONSTRAINT IF EXISTS invoices_user_id_fkey;

ALTER TABLE public.invoices
  ADD CONSTRAINT invoices_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;