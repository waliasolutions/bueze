
-- Add mwst_mode column to billing_settings
ALTER TABLE public.billing_settings
  ADD COLUMN mwst_mode text NOT NULL DEFAULT 'none';

-- Recreate the public view to include mwst_mode
DROP VIEW IF EXISTS public.billing_settings_public;
CREATE VIEW public.billing_settings_public AS
  SELECT
    company_name,
    company_legal_name,
    company_street,
    company_zip,
    company_city,
    company_country,
    company_email,
    company_phone,
    company_website,
    mwst_number,
    mwst_rate,
    mwst_note,
    mwst_mode
  FROM public.billing_settings;

-- Grant anon access to the view
GRANT SELECT ON public.billing_settings_public TO anon;
GRANT SELECT ON public.billing_settings_public TO authenticated;
