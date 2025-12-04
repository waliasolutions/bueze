UPDATE page_content 
SET seo = jsonb_set(seo, '{title}', '"Büeze | Handwerker Marktplatz Schweiz"')
WHERE page_key = 'homepage';