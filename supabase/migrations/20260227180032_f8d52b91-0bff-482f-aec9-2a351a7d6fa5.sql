ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS delivered_at timestamptz DEFAULT NULL,
ADD COLUMN IF NOT EXISTS delivered_by uuid DEFAULT NULL;