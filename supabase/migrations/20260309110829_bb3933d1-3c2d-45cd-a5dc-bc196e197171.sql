-- Create invoices table for subscription billing
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL UNIQUE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_id text,
  amount integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'CHF',
  tax_rate numeric NOT NULL DEFAULT 7.7,
  tax_amount integer NOT NULL DEFAULT 0,
  net_amount integer NOT NULL DEFAULT 0,
  plan_type text NOT NULL DEFAULT 'free',
  status text NOT NULL DEFAULT 'issued',
  issued_at timestamp with time zone NOT NULL DEFAULT now(),
  due_date timestamp with time zone NOT NULL DEFAULT (now() + interval '30 days'),
  paid_at timestamp with time zone,
  pdf_storage_path text,
  description text NOT NULL DEFAULT '',
  billing_name text NOT NULL DEFAULT '',
  billing_company text,
  billing_address text,
  billing_zip text,
  billing_city text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Comment for documentation
COMMENT ON TABLE public.invoices IS 'Subscription invoices for handwerker accounts';

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Users can view their own invoices
CREATE POLICY "Users can view own invoices"
  ON public.invoices FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all invoices
CREATE POLICY "Admins can view all invoices"
  ON public.invoices FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Admins can update invoices (status changes)
CREATE POLICY "Admins can update invoices"
  ON public.invoices FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- System/service can insert invoices
CREATE POLICY "Service can insert invoices"
  ON public.invoices FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Updated_at trigger
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create invoices storage bucket if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('invoices', 'invoices', false)
ON CONFLICT (id) DO NOTHING;