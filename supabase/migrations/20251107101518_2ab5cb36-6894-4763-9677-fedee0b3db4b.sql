-- Clean up broken handwerker profiles with NULL critical fields
DELETE FROM handwerker_profiles 
WHERE verification_status = 'pending' 
AND (first_name IS NULL OR last_name IS NULL OR email IS NULL)
AND created_at < now() - interval '30 days';

-- Create function to validate handwerker data
CREATE OR REPLACE FUNCTION validate_handwerker_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate first_name
  IF NEW.first_name IS NOT NULL THEN
    IF LENGTH(TRIM(NEW.first_name)) < 2 THEN
      RAISE EXCEPTION 'First name must be at least 2 characters';
    END IF;
    IF LOWER(NEW.first_name) ~ '(test|asdf|dummy|example|aaa|zzz)' THEN
      RAISE EXCEPTION 'Invalid first name detected';
    END IF;
  END IF;

  -- Validate last_name
  IF NEW.last_name IS NOT NULL THEN
    IF LENGTH(TRIM(NEW.last_name)) < 2 THEN
      RAISE EXCEPTION 'Last name must be at least 2 characters';
    END IF;
    IF LOWER(NEW.last_name) ~ '(test|asdf|dummy|example|aaa|zzz)' THEN
      RAISE EXCEPTION 'Invalid last name detected';
    END IF;
  END IF;

  -- Validate email
  IF NEW.email IS NOT NULL THEN
    IF LOWER(NEW.email) ~ '(test@test|example@example|asdf@|dummy@)' THEN
      RAISE EXCEPTION 'Invalid email detected';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for validation
DROP TRIGGER IF EXISTS validate_handwerker_before_insert ON handwerker_profiles;
CREATE TRIGGER validate_handwerker_before_insert
  BEFORE INSERT OR UPDATE ON handwerker_profiles
  FOR EACH ROW
  EXECUTE FUNCTION validate_handwerker_data();