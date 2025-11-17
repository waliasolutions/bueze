-- Extend site_seo_settings for GTM-only approach
ALTER TABLE site_seo_settings 
ADD COLUMN IF NOT EXISTS gtm_container_id text,
ADD COLUMN IF NOT EXISTS google_analytics_id text,
ADD COLUMN IF NOT EXISTS google_search_console_verification text,
ADD COLUMN IF NOT EXISTS default_meta_title text DEFAULT 'Büeze.ch - Geprüfte Handwerker in der Schweiz finden',
ADD COLUMN IF NOT EXISTS default_meta_description text DEFAULT 'Finden Sie qualifizierte und geprüfte Handwerker in Ihrer Region. Kostenlose Offerten, transparente Preise, schnelle Vermittlung.',
ADD COLUMN IF NOT EXISTS default_og_image text DEFAULT 'https://bueeze.ch/og-image.jpg',
ADD COLUMN IF NOT EXISTS site_name text DEFAULT 'Büeze.ch';

-- Update existing row with GTM container ID if it exists
UPDATE site_seo_settings
SET gtm_container_id = 'GTM-NCN6TXZX'
WHERE id = (SELECT id FROM site_seo_settings LIMIT 1);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_site_seo_settings_gtm ON site_seo_settings(gtm_container_id);