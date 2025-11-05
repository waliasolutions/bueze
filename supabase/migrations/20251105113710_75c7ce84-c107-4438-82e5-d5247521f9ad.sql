-- Add personal information fields to handwerker_profiles table
ALTER TABLE public.handwerker_profiles
ADD COLUMN first_name text,
ADD COLUMN last_name text,
ADD COLUMN email text,
ADD COLUMN phone_number text,
ADD COLUMN personal_address text,
ADD COLUMN personal_zip text,
ADD COLUMN personal_city text,
ADD COLUMN personal_canton text;

-- Add comment to document the purpose of these fields
COMMENT ON COLUMN public.handwerker_profiles.first_name IS 'Contact person first name';
COMMENT ON COLUMN public.handwerker_profiles.last_name IS 'Contact person last name';
COMMENT ON COLUMN public.handwerker_profiles.email IS 'Contact person email address';
COMMENT ON COLUMN public.handwerker_profiles.phone_number IS 'Contact person phone number';
COMMENT ON COLUMN public.handwerker_profiles.personal_address IS 'Personal address of the contact person';
COMMENT ON COLUMN public.handwerker_profiles.personal_zip IS 'Personal postal code';
COMMENT ON COLUMN public.handwerker_profiles.personal_city IS 'Personal city';
COMMENT ON COLUMN public.handwerker_profiles.personal_canton IS 'Personal canton';