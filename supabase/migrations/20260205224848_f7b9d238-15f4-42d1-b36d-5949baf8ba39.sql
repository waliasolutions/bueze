-- Add Zefix verification support to handwerker_profiles
ALTER TABLE handwerker_profiles 
ADD COLUMN IF NOT EXISTS zefix_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS zefix_data JSONB;

-- Add comment for documentation
COMMENT ON COLUMN handwerker_profiles.zefix_verified IS 'Whether the company has been verified via Swiss Trade Registry (Zefix) API';
COMMENT ON COLUMN handwerker_profiles.zefix_data IS 'JSON data from Zefix API verification response';