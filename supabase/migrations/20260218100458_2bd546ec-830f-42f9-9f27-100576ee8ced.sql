-- Add UNIQUE constraint on payrexx_transaction_id (partial, WHERE NOT NULL)
CREATE UNIQUE INDEX payment_history_payrexx_transaction_id_unique 
ON payment_history (payrexx_transaction_id) 
WHERE payrexx_transaction_id IS NOT NULL;