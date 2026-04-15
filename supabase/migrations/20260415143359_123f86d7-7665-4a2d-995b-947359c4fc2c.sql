-- Clean up invalid phone entries in profiles
UPDATE public.profiles SET phone = NULL WHERE phone = 'info@bueeze.ch' OR phone = '';

-- Clean up invalid phone entries in handwerker_profiles
UPDATE public.handwerker_profiles SET phone_number = NULL WHERE phone_number = 'info@bueeze.ch' OR phone_number = '';

-- Add CHECK constraint on profiles.phone
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_phone_format_check
  CHECK (phone IS NULL OR phone ~ '^[0-9+\s()/-]+$');

-- Add CHECK constraint on handwerker_profiles.phone_number
ALTER TABLE public.handwerker_profiles
  ADD CONSTRAINT handwerker_phone_format_check
  CHECK (phone_number IS NULL OR phone_number ~ '^[0-9+\s()/-]+$');