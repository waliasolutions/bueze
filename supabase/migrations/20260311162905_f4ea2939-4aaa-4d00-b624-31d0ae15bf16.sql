
-- 1. Create billing_settings table (single-row config)
CREATE TABLE public.billing_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL DEFAULT 'Büeze.ch',
  company_legal_name text NOT NULL DEFAULT 'Büeze.ch GmbH',
  company_street text NOT NULL DEFAULT 'Industriestrasse 28',
  company_zip text NOT NULL DEFAULT '9487',
  company_city text NOT NULL DEFAULT 'Gamprin-Bendern',
  company_country text NOT NULL DEFAULT 'Liechtenstein',
  company_email text NOT NULL DEFAULT 'info@bueeze.ch',
  company_phone text NOT NULL DEFAULT '+41 41 558 22 33',
  company_website text NOT NULL DEFAULT 'www.bueeze.ch',
  mwst_number text DEFAULT NULL,
  mwst_rate numeric NOT NULL DEFAULT 0,
  mwst_note text DEFAULT 'MWST befreit (Liechtenstein)',
  updated_at timestamptz DEFAULT now()
);

-- Seed single row
INSERT INTO public.billing_settings DEFAULT VALUES;

-- RLS on base table
ALTER TABLE public.billing_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read billing settings"
  ON public.billing_settings FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can update billing settings"
  ON public.billing_settings FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2. Public view (anon-readable, only non-sensitive fields)
CREATE VIEW public.billing_settings_public AS
  SELECT company_name, company_legal_name, company_street, company_zip,
         company_city, company_country, company_email, company_phone,
         company_website, mwst_number, mwst_rate, mwst_note
  FROM public.billing_settings LIMIT 1;

GRANT SELECT ON public.billing_settings_public TO anon;
GRANT SELECT ON public.billing_settings_public TO authenticated;

-- 3. Invoice snapshot column + fix tax_rate default
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS billing_snapshot jsonb;
ALTER TABLE public.invoices ALTER COLUMN tax_rate SET DEFAULT 0;

-- 4. Updated_at trigger for billing_settings
CREATE TRIGGER update_billing_settings_updated_at
  BEFORE UPDATE ON public.billing_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
