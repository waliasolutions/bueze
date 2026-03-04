ALTER TABLE handwerker_profiles 
  DROP CONSTRAINT handwerker_profiles_verification_status_check;

ALTER TABLE handwerker_profiles 
  ADD CONSTRAINT handwerker_profiles_verification_status_check 
  CHECK (verification_status = ANY (ARRAY['pending', 'approved', 'rejected', 'needs_review', 'inactive']));