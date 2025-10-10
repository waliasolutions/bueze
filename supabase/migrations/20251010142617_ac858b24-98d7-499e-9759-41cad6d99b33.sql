-- Fix search_path for validate_lead_media function
CREATE OR REPLACE FUNCTION validate_lead_media()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate media_urls array
  IF array_length(NEW.media_urls, 1) > 10 THEN
    RAISE EXCEPTION 'Maximum 10 media files allowed per lead';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;