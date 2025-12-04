UPDATE page_content 
SET seo = jsonb_set(seo, '{title}', '"Lokale Handwerker finden | Handwerker Schweiz | Büeze.ch"')
WHERE page_key = 'homepage';