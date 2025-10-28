-- Add billing and company fields to handwerker_profiles
ALTER TABLE handwerker_profiles
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS company_legal_form TEXT CHECK (company_legal_form IN ('einzelfirma', 'gmbh', 'ag', 'kollektivgesellschaft', 'other')),
ADD COLUMN IF NOT EXISTS uid_number TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS mwst_number TEXT,
ADD COLUMN IF NOT EXISTS business_address TEXT,
ADD COLUMN IF NOT EXISTS business_zip TEXT,
ADD COLUMN IF NOT EXISTS business_city TEXT,
ADD COLUMN IF NOT EXISTS business_canton TEXT,
ADD COLUMN IF NOT EXISTS iban TEXT,
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS liability_insurance_provider TEXT,
ADD COLUMN IF NOT EXISTS liability_insurance_policy_number TEXT,
ADD COLUMN IF NOT EXISTS trade_license_number TEXT,
ADD COLUMN IF NOT EXISTS tax_id TEXT;

-- Add personal information fields to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Create index on UID number for faster lookups
CREATE INDEX IF NOT EXISTS idx_handwerker_profiles_uid ON handwerker_profiles(uid_number);

-- Add comment for documentation
COMMENT ON COLUMN handwerker_profiles.uid_number IS 'Swiss UID number format: CHE-XXX.XXX.XXX';
COMMENT ON COLUMN handwerker_profiles.mwst_number IS 'Swiss MWST number format: CHE-XXX.XXX.XXX MWST';
COMMENT ON COLUMN handwerker_profiles.iban IS 'Swiss IBAN format: CH## #### #### #### #### #';