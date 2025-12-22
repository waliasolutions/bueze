-- Remove the unique constraint on uid_number to allow duplicates
-- This keeps EMAIL as the single source of truth (SSOT)
-- Multiple handwerkers can have the same UID (franchises, branches, subsidiaries, test data)

-- Drop the unique constraint on uid_number
ALTER TABLE public.handwerker_profiles 
DROP CONSTRAINT IF EXISTS handwerker_profiles_uid_number_key;

-- Also drop any unique index if it exists
DROP INDEX IF EXISTS idx_handwerker_profiles_uid;
DROP INDEX IF EXISTS handwerker_profiles_uid_number_key;

-- Re-create a non-unique index for query performance
CREATE INDEX IF NOT EXISTS idx_handwerker_profiles_uid_lookup 
ON public.handwerker_profiles (uid_number) 
WHERE uid_number IS NOT NULL;

-- Add a comment explaining the design decision
COMMENT ON COLUMN public.handwerker_profiles.uid_number IS 
'Swiss UID (Unternehmens-Identifikationsnummer). NOT unique - allows franchises, subsidiaries, and data correction. Email is the SSOT.';

-- Clean up test data with fake emails that may be blocking production registrations
DELETE FROM public.handwerker_profiles 
WHERE email LIKE '%@bialode.com' 
   OR email LIKE '%@gajd.ch'
   OR email LIKE '%@test.test'
   OR email LIKE '%@example.com';