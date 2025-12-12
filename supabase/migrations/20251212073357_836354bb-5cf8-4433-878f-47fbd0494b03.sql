-- Create payment_history table for tracking all Stripe payments
CREATE TABLE public.payment_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  stripe_invoice_id TEXT,
  stripe_payment_intent_id TEXT,
  amount INTEGER NOT NULL, -- Amount in cents (CHF)
  currency TEXT NOT NULL DEFAULT 'chf',
  plan_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'paid', -- paid, failed, refunded
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  invoice_pdf_url TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own payments
CREATE POLICY "Users can view own payment history"
ON public.payment_history
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all payments
CREATE POLICY "Admins can view all payment history"
ON public.payment_history
FOR SELECT
USING (get_user_role(auth.uid()) = 'admin'::app_role);

-- System/webhook can insert payments (via service role)
CREATE POLICY "System can insert payment history"
ON public.payment_history
FOR INSERT
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_payment_history_user_id ON public.payment_history(user_id);
CREATE INDEX idx_payment_history_payment_date ON public.payment_history(payment_date DESC);
CREATE INDEX idx_payment_history_status ON public.payment_history(status);