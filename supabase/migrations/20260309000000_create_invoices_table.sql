-- ============================================================
-- Invoice Management System
-- Creates invoices table, RLS policies, storage bucket, and
-- email trigger for automatic invoice delivery
-- ============================================================

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  payment_id uuid REFERENCES payment_history(id),
  amount integer NOT NULL,                -- total in Rappen (cents)
  currency text NOT NULL DEFAULT 'CHF',
  tax_rate numeric(5,2) DEFAULT 0,        -- MWST % (7.7 for Swiss standard, 0 if exempt)
  tax_amount integer DEFAULT 0,           -- tax in Rappen
  net_amount integer NOT NULL,            -- pre-tax in Rappen
  plan_type text NOT NULL,
  status text NOT NULL DEFAULT 'issued' CHECK (status IN ('issued','paid','cancelled','refunded')),
  issued_at timestamptz NOT NULL DEFAULT now(),
  due_date timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  paid_at timestamptz,
  pdf_storage_path text,                  -- Storage file path (NOT a signed URL) e.g. "{userId}/{invoiceNumber}.pdf"
  description text NOT NULL,
  billing_name text NOT NULL,
  billing_company text,
  billing_address text,
  billing_zip text,
  billing_city text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Invoice number generation: BUE-{YEAR}-{5-digit sequence}
-- Uses Swiss timezone (Europe/Zurich) to avoid year boundary bugs at midnight UTC
CREATE SEQUENCE IF NOT EXISTS invoice_seq START 1;

CREATE OR REPLACE FUNCTION generate_invoice_number() RETURNS text AS $$
  SELECT 'BUE-' || extract(year from (now() AT TIME ZONE 'Europe/Zurich'))::text || '-' || lpad(nextval('invoice_seq')::text, 5, '0');
$$ LANGUAGE sql;

-- NOTE on gapless numbering: PostgreSQL SEQUENCE may produce gaps if transactions
-- roll back after calling nextval(). This is acceptable for MVP and most Swiss
-- accounting standards. If strict gapless numbering becomes a legal requirement,
-- replace with a dedicated counter table using row-level locks.

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_issued_at ON invoices(issued_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_id ON invoices(payment_id);

-- RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Users can view their own invoices
CREATE POLICY "Users can view own invoices" ON invoices
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all invoices
CREATE POLICY "Admins can view all invoices" ON invoices
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
  );

-- Admins can update invoice status (cancel, refund)
CREATE POLICY "Admins can update invoices" ON invoices
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
  );

-- Service role can do everything (edge functions)
CREATE POLICY "Service role full access on invoices" ON invoices
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- Storage bucket for invoice PDFs (private)
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', false)
ON CONFLICT (id) DO NOTHING;

-- Users can read their own invoice PDFs
CREATE POLICY "Users can read own invoice PDFs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'invoices'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admins can read all invoice PDFs
CREATE POLICY "Admins can read all invoice PDFs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'invoices'
    AND (
      public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'super_admin')
    )
  );

-- Service role can manage invoice PDFs (upload, delete)
CREATE POLICY "Service role manages invoice PDFs" ON storage.objects
  FOR ALL USING (
    bucket_id = 'invoices'
    AND auth.role() = 'service_role'
  );

-- ============================================================
-- DB trigger: send invoice email when PDF is ready
-- Uses pg_net to call the send-invoice-email edge function.
--
-- PREREQUISITE: Set these GUC variables via SQL editor (one-time):
--   ALTER DATABASE postgres SET "app.settings.supabase_url" = 'https://<project>.supabase.co';
--   ALTER DATABASE postgres SET "app.settings.service_role_key" = '<key>';
-- ============================================================
CREATE OR REPLACE FUNCTION notify_invoice_email() RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'paid' AND NEW.pdf_storage_path IS NOT NULL THEN
    PERFORM net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/send-invoice-email',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object('invoiceId', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_send_invoice_email
  AFTER INSERT OR UPDATE OF pdf_storage_path ON invoices
  FOR EACH ROW EXECUTE FUNCTION notify_invoice_email();
