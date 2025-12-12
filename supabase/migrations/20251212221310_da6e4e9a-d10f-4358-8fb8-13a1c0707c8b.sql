-- Create table for tracking handwerker documents with expiry dates
CREATE TABLE public.handwerker_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  handwerker_profile_id UUID NOT NULL REFERENCES public.handwerker_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  document_type TEXT NOT NULL,
  document_name TEXT NOT NULL,
  document_url TEXT NOT NULL,
  expiry_date DATE,
  issued_date DATE,
  issuing_authority TEXT,
  document_number TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID,
  reminder_30_sent BOOLEAN DEFAULT FALSE,
  reminder_14_sent BOOLEAN DEFAULT FALSE,
  reminder_7_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.handwerker_documents ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own documents"
ON public.handwerker_documents
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents"
ON public.handwerker_documents
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents"
ON public.handwerker_documents
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
ON public.handwerker_documents
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all documents"
ON public.handwerker_documents
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_roles.user_id = auth.uid()
  AND user_roles.role IN ('admin', 'super_admin')
));

CREATE POLICY "Admins can update all documents"
ON public.handwerker_documents
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_roles.user_id = auth.uid()
  AND user_roles.role IN ('admin', 'super_admin')
));

-- Create index for expiry date queries
CREATE INDEX idx_handwerker_documents_expiry ON public.handwerker_documents(expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX idx_handwerker_documents_user ON public.handwerker_documents(user_id);
CREATE INDEX idx_handwerker_documents_profile ON public.handwerker_documents(handwerker_profile_id);

-- Create trigger for updated_at
CREATE TRIGGER update_handwerker_documents_updated_at
BEFORE UPDATE ON public.handwerker_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create view for documents expiring soon
CREATE OR REPLACE VIEW public.expiring_documents AS
SELECT 
  hd.*,
  hp.first_name,
  hp.last_name,
  hp.email,
  hp.company_name,
  CASE 
    WHEN hd.expiry_date <= CURRENT_DATE THEN 'expired'
    WHEN hd.expiry_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'expiring_7'
    WHEN hd.expiry_date <= CURRENT_DATE + INTERVAL '14 days' THEN 'expiring_14'
    WHEN hd.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_30'
    ELSE 'valid'
  END AS expiry_status
FROM public.handwerker_documents hd
JOIN public.handwerker_profiles hp ON hd.handwerker_profile_id = hp.id
WHERE hd.expiry_date IS NOT NULL;