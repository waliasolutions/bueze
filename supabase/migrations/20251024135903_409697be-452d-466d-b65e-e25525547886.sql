-- Fix 1: Update all database functions to have immutable search_path for security

-- Fix increment_lead_purchased_count (already has correct search_path)
CREATE OR REPLACE FUNCTION public.increment_lead_purchased_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.leads
  SET purchased_count = purchased_count + 1
  WHERE id = NEW.lead_id;
  RETURN NEW;
END;
$function$;

-- Fix delete_expired_contact_requests (change to public)
CREATE OR REPLACE FUNCTION public.delete_expired_contact_requests()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.contact_requests WHERE expires_at < now();
END;
$function$;

-- Fix update_conversation_timestamp (change to public)
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.conversations 
  SET 
    updated_at = now(),
    last_message_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$function$;

-- Fix update_updated_at_column (change to public)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Fix setup_admin_user (missing search_path)
CREATE OR REPLACE FUNCTION public.setup_admin_user(user_email text, user_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_uuid uuid;
BEGIN
  -- Generate a UUID for the user
  user_uuid := gen_random_uuid();
  
  -- Insert into profiles
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (user_uuid, user_email, user_name)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;
  
  -- Insert admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (user_uuid, 'admin'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$function$;

-- Fix budget_ranges_overlap (change to public)
CREATE OR REPLACE FUNCTION public.budget_ranges_overlap(lead_min integer, lead_max integer, search_min integer, search_max integer)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $function$
BEGIN
  -- Handle null values
  IF lead_min IS NULL AND lead_max IS NULL THEN
    RETURN true;
  END IF;
  
  IF search_min IS NULL OR search_max IS NULL THEN
    RETURN true;
  END IF;
  
  IF lead_min IS NULL THEN
    lead_min := lead_max;
  END IF;
  
  IF lead_max IS NULL THEN
    lead_max := lead_min;
  END IF;
  
  -- Check if ranges overlap
  RETURN (lead_max >= search_min AND lead_min <= search_max);
END;
$function$;

-- Fix update_handwerker_search_text (change to public)
CREATE OR REPLACE FUNCTION public.update_handwerker_search_text()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.search_text := 
    setweight(to_tsvector('german', COALESCE(NEW.bio, '')), 'A') ||
    setweight(to_tsvector('german', array_to_string(NEW.categories::text[], ' ')), 'B') ||
    setweight(to_tsvector('german', array_to_string(NEW.service_areas, ' ')), 'C') ||
    setweight(to_tsvector('german', COALESCE(NEW.business_license, '')), 'D');
  RETURN NEW;
END;
$function$;