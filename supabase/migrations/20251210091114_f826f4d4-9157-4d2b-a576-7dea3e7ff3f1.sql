UPDATE page_content 
SET fields = jsonb_set(fields, '{title}', '"Handwerker finden. Projekte realisieren."')
WHERE page_key = 'homepage_hero'