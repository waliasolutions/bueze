-- Add Payrexx payment provider columns to payment_history table
-- These columns are used by the payrexx-webhook edge function for payment tracking

ALTER TABLE public.payment_history
  ADD COLUMN IF NOT EXISTS payrexx_transaction_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT 'payrexx';

-- Unique constraint on payrexx_transaction_id for idempotency
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_history_payrexx_txn_unique
  ON public.payment_history (payrexx_transaction_id)
  WHERE payrexx_transaction_id IS NOT NULL;
