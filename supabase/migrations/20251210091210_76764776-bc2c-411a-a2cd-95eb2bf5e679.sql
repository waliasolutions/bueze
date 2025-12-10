UPDATE page_content 
SET fields = jsonb_set(fields, '{ctaText}', '"Jetzt starten"')
WHERE page_key = 'homepage_hero'