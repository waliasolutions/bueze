-- Fix Küche category page_key to match the slug
UPDATE page_content 
SET page_key = 'major-kueche' 
WHERE page_key = 'major-kueche-bad';