-- Fix Küche typo and update all major category titles to natural format
UPDATE page_content 
SET 
  fields = jsonb_set(fields, '{intro}', '"Eine neue Küche ist eine langfristige Investition in Lebensqualität. Finden Sie erfahrene Küchenbauer in der Schweiz für Planung, Montage und Renovation. Von der ersten Idee bis zur fertigen Traumküche – vergleichen Sie kostenlos Offerten von Fachbetrieben."'),
  seo = jsonb_set(seo, '{title}', '"Küchenbauer finden in der Schweiz | Büeze.ch"')
WHERE page_key = 'major-kueche';

UPDATE page_content SET seo = jsonb_set(seo, '{title}', '"Bau & Renovation – Handwerker finden | Büeze.ch"') WHERE page_key = 'major-bau-renovation';
UPDATE page_content SET seo = jsonb_set(seo, '{title}', '"Elektriker finden in der Schweiz | Büeze.ch"') WHERE page_key = 'major-elektroinstallationen';
UPDATE page_content SET seo = jsonb_set(seo, '{title}', '"Heizung & Klima Installateure finden | Büeze.ch"') WHERE page_key = 'major-heizung-klima';
UPDATE page_content SET seo = jsonb_set(seo, '{title}', '"Sanitär-Fachbetriebe in der Schweiz | Büeze.ch"') WHERE page_key = 'major-sanitaer';
UPDATE page_content SET seo = jsonb_set(seo, '{title}', '"Bodenleger finden in der Schweiz | Büeze.ch"') WHERE page_key = 'major-bodenbelaege';
UPDATE page_content SET seo = jsonb_set(seo, '{title}', '"Schreiner & Innenausbau in der Schweiz | Büeze.ch"') WHERE page_key = 'major-innenausbau-schreiner';
UPDATE page_content SET seo = jsonb_set(seo, '{title}', '"Gartenbau & Aussenbereich | Büeze.ch"') WHERE page_key = 'major-garten-aussenbereich';
UPDATE page_content SET seo = jsonb_set(seo, '{title}', '"Räumung & Entsorgung in der Schweiz | Büeze.ch"') WHERE page_key = 'major-raeumung-entsorgung';
UPDATE page_content SET seo = jsonb_set(seo, '{title}', '"Weitere Handwerkerleistungen | Büeze.ch"') WHERE page_key = 'major-sonstige-handwerkerleistungen';