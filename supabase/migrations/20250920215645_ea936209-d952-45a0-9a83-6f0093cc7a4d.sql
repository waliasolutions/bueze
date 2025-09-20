-- Add full-text search to handwerker_profiles table
ALTER TABLE public.handwerker_profiles ADD COLUMN search_text tsvector;

-- Create function to update search text
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
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update search_text
CREATE TRIGGER update_handwerker_search_text_trigger
  BEFORE INSERT OR UPDATE ON public.handwerker_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_handwerker_search_text();

-- Create index for full-text search
CREATE INDEX idx_handwerker_profiles_search_text ON public.handwerker_profiles USING GIN(search_text);

-- Update existing profiles to populate search_text
UPDATE public.handwerker_profiles SET search_text = 
  setweight(to_tsvector('german', COALESCE(bio, '')), 'A') ||
  setweight(to_tsvector('german', array_to_string(categories::text[], ' ')), 'B') ||
  setweight(to_tsvector('german', array_to_string(service_areas, ' ')), 'C') ||
  setweight(to_tsvector('german', COALESCE(business_license, '')), 'D');