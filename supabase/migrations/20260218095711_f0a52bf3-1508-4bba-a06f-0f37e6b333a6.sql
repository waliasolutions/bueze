
-- Phase 1.2: Make handwerker-documents bucket private (GDPR/DSG compliance)
UPDATE storage.buckets SET public = false WHERE id = 'handwerker-documents';

-- Phase 1.3: Add UNIQUE constraint on payrexx_transaction_id for webhook idempotency
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_history_payrexx_txn_unique 
ON public.payment_history (payrexx_transaction_id) 
WHERE payrexx_transaction_id IS NOT NULL;

-- Add RLS policies for authenticated users to access their own documents in storage
CREATE POLICY "Users can view own handwerker documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'handwerker-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload own handwerker documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'handwerker-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own handwerker documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'handwerker-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
