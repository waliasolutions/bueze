-- Add request_id column to lead_purchases for idempotency
ALTER TABLE public.lead_purchases 
ADD COLUMN IF NOT EXISTS request_id TEXT;

-- Create unique index on request_id to prevent duplicate purchases
CREATE UNIQUE INDEX IF NOT EXISTS idx_lead_purchases_request_id 
ON public.lead_purchases (request_id) 
WHERE request_id IS NOT NULL;

-- Add comment explaining the purpose
COMMENT ON COLUMN public.lead_purchases.request_id IS 'Unique request identifier for idempotent purchase operations';
