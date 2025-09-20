-- Fix security issues by adding search_path to functions
CREATE OR REPLACE FUNCTION budget_ranges_overlap(
  lead_min integer,
  lead_max integer,
  search_min integer,
  search_max integer
) RETURNS boolean 
LANGUAGE plpgsql 
IMMUTABLE
SET search_path = ''
AS $$
BEGIN
  -- Handle null values
  IF lead_min IS NULL AND lead_max IS NULL THEN
    RETURN true; -- Budget on request matches any search
  END IF;
  
  IF search_min IS NULL OR search_max IS NULL THEN
    RETURN true; -- No budget filter means show all
  END IF;
  
  -- Use lead_max as lead_min if lead_min is null
  IF lead_min IS NULL THEN
    lead_min := lead_max;
  END IF;
  
  -- Use lead_min as lead_max if lead_max is null
  IF lead_max IS NULL THEN
    lead_max := lead_min;
  END IF;
  
  -- Check if ranges overlap
  RETURN (lead_max >= search_min AND lead_min <= search_max);
END;
$$;