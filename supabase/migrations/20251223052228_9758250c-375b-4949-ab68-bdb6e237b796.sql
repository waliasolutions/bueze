-- Fix missing handwerker profile for info@mb-gebaeudetechnik.ch
-- User ID: 922bc65b-1bff-45ba-98b6-2449ae4e3910

-- First check if user exists in auth.users and profiles
DO $$
DECLARE
  v_user_id uuid := '922bc65b-1bff-45ba-98b6-2449ae4e3910';
  v_existing_profile_id uuid;
BEGIN
  -- Check if handwerker profile already exists for this user
  SELECT id INTO v_existing_profile_id
  FROM public.handwerker_profiles
  WHERE user_id = v_user_id;
  
  IF v_existing_profile_id IS NOT NULL THEN
    RAISE NOTICE 'Handwerker profile already exists for user %', v_user_id;
  ELSE
    -- Create handwerker profile for existing user
    INSERT INTO public.handwerker_profiles (
      user_id,
      email,
      first_name,
      last_name,
      company_name,
      verification_status,
      is_verified,
      categories,
      service_areas
    ) 
    SELECT 
      v_user_id,
      p.email,
      SPLIT_PART(p.full_name, ' ', 1),
      SUBSTRING(p.full_name FROM POSITION(' ' IN p.full_name) + 1),
      COALESCE(p.company_name, 'MB Gebäudetechnik'),
      'pending',
      false,
      ARRAY[]::handwerker_category[],
      ARRAY[]::text[]
    FROM public.profiles p
    WHERE p.id = v_user_id;
    
    RAISE NOTICE 'Created handwerker profile for user %', v_user_id;
  END IF;
END $$;

-- Ensure user has handwerker role
INSERT INTO public.user_roles (user_id, role)
VALUES ('922bc65b-1bff-45ba-98b6-2449ae4e3910', 'handwerker')
ON CONFLICT (user_id, role) DO NOTHING;