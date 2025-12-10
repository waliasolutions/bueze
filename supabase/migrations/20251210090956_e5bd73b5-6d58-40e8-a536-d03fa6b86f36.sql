UPDATE page_content 
SET fields = jsonb_set(fields, '{subtitle}', '"Handwerkermarktplatz in der Schweiz | Lokales Schweizer Handwerkerportal"')
WHERE page_key = 'homepage_hero'