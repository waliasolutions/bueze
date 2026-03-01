-- Fix validate_handwerker_data trigger:
-- 1. Remove overly aggressive "test/dummy" name blocking (blocks legitimate QA and real names like "Tester", "Protester")
-- 2. Use German error messages so users see clear reasons
-- 3. Keep minimum length checks (2 chars) which are reasonable

CREATE OR REPLACE FUNCTION public.validate_handwerker_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Validate first_name (minimum 2 characters)
  IF NEW.first_name IS NOT NULL AND LENGTH(TRIM(NEW.first_name)) < 2 THEN
    RAISE EXCEPTION 'Vorname muss mindestens 2 Zeichen lang sein.';
  END IF;

  -- Validate last_name (minimum 2 characters)
  IF NEW.last_name IS NOT NULL AND LENGTH(TRIM(NEW.last_name)) < 2 THEN
    RAISE EXCEPTION 'Nachname muss mindestens 2 Zeichen lang sein.';
  END IF;

  -- Validate email format (basic check)
  IF NEW.email IS NOT NULL AND NEW.email !~ '^[^@]+@[^@]+\.[^@]+$' THEN
    RAISE EXCEPTION 'Ungültige E-Mail-Adresse.';
  END IF;

  RETURN NEW;
END;
$function$;
