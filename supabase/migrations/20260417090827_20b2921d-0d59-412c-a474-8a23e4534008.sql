-- Fix overly aggressive name validation trigger that rejects "Testa" because it contains "test"
CREATE OR REPLACE FUNCTION public.validate_handwerker_data()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.first_name IS NOT NULL THEN
    IF LENGTH(TRIM(NEW.first_name)) < 2 THEN
      RAISE EXCEPTION 'First name must be at least 2 characters';
    END IF;
    -- Word-boundary match: rejects exact placeholder words, allows real names like "Testa"
    IF LOWER(TRIM(NEW.first_name)) ~ '\m(test|asdf|dummy|example|aaa|zzz)\M' THEN
      RAISE EXCEPTION 'Invalid first name detected';
    END IF;
  END IF;

  IF NEW.last_name IS NOT NULL THEN
    IF LENGTH(TRIM(NEW.last_name)) < 2 THEN
      RAISE EXCEPTION 'Last name must be at least 2 characters';
    END IF;
    IF LOWER(TRIM(NEW.last_name)) ~ '\m(test|asdf|dummy|example|aaa|zzz)\M' THEN
      RAISE EXCEPTION 'Invalid last name detected';
    END IF;
  END IF;

  IF NEW.email IS NOT NULL THEN
    IF LOWER(NEW.email) ~ '(test@test|example@example|asdf@|dummy@)' THEN
      RAISE EXCEPTION 'Invalid email detected';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- 1) Promote Renato to handwerker role
INSERT INTO public.user_roles (user_id, role)
VALUES ('bca01510-20d5-462b-a392-40342572217d', 'handwerker'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;

-- 2) Create the missing handwerker_profiles row
INSERT INTO public.handwerker_profiles (
  user_id, email, first_name, last_name, phone_number,
  company_name, company_legal_form,
  verification_status, is_verified
)
VALUES (
  'bca01510-20d5-462b-a392-40342572217d',
  'renato.testa@mlg-ag.ch',
  'Renato', 'Testa',
  '+41 31 330 20 70',
  'MLG AG', 'ag',
  'pending', false
)
ON CONFLICT DO NOTHING;