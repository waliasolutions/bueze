-- Fix function search path security issue
CREATE OR REPLACE FUNCTION public.update_handwerker_search_text()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_text := 
    setweight(to_tsvector('german', COALESCE(NEW.bio, '')), 'A') ||
    setweight(to_tsvector('german', array_to_string(NEW.categories::text[], ' ')), 'B') ||
    setweight(to_tsvector('german', array_to_string(NEW.service_areas, ' ')), 'C') ||
    setweight(to_tsvector('german', COALESCE(NEW.business_license, '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';