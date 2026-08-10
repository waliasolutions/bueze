DROP INDEX IF EXISTS public.idx_payment_history_payrexx_txn_unique;
DROP INDEX IF EXISTS public.payment_history_payrexx_transaction_id_unique;

ALTER TABLE public.payment_history
  ADD CONSTRAINT payment_history_payrexx_transaction_id_key
  UNIQUE (payrexx_transaction_id);