-- Add full-text search capabilities to leads table
-- Create a generated column that combines title and description for search
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS search_text tsvector 
GENERATED ALWAYS AS (to_tsvector('german', coalesce(title, '') || ' ' || coalesce(description, ''))) STORED;

-- Create index for full-text search
CREATE INDEX IF NOT EXISTS leads_search_idx ON public.leads USING gin(search_text);

-- Create index for location searches
CREATE INDEX IF NOT EXISTS leads_location_idx ON public.leads (zip, city, canton);

-- Create index for budget searches
CREATE INDEX IF NOT EXISTS leads_budget_idx ON public.leads (budget_min, budget_max);

-- Create function to check if budget ranges overlap
CREATE OR REPLACE FUNCTION budget_ranges_overlap(
  lead_min integer,
  lead_max integer,
  search_min integer,
  search_max integer
) RETURNS boolean AS $$
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
$$ LANGUAGE plpgsql IMMUTABLE;