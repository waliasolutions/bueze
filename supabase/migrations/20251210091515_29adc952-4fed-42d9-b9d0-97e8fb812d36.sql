UPDATE page_content 
SET fields = jsonb_set(fields, '{subtitle}', '"Ihr lokaler Handwerker-Marktplatz für die ganze Schweiz"')
WHERE page_key = 'homepage_hero'