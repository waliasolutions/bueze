-- Create the app_role enum type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('user', 'handwerker', 'admin', 'super_admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Also ensure user_role enum exists for profiles table
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('homeowner', 'handwerker');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update the handle_new_user function to handle the role from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', COALESCE(NEW.raw_user_meta_data->>'first_name', '') || ' ' || COALESCE(NEW.raw_user_meta_data->>'last_name', '')),
    COALESCE(NEW.raw_user_meta_data->>'role', 'homeowner')::user_role
  );
  
  -- Assign app role based on user role
  IF NEW.email = 'admin@test.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSIF COALESCE(NEW.raw_user_meta_data->>'role', 'homeowner') = 'handwerker' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'handwerker'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;