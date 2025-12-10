-- Update homepage SEO
UPDATE page_content 
SET seo = jsonb_set(
  jsonb_set(seo, '{title}', '"Handwerker in Ihrer Nähe finden | Büeze.ch"'),
  '{description}', '"Sie suchen einen zuverlässigen Handwerker? Auf Büeze.ch finden Sie geprüfte Fachbetriebe aus Ihrer Region. Beschreiben Sie Ihr Projekt und vergleichen Sie kostenlos mehrere Offerten."'
)
WHERE page_key = 'homepage';

-- Update handwerker landing SEO
UPDATE page_content 
SET seo = jsonb_set(
  jsonb_set(seo, '{title}', '"Als Handwerker neue Aufträge finden | Büeze.ch"'),
  '{description}', '"Sie möchten als Handwerker mehr Aufträge gewinnen? Registrieren Sie sich kostenlos auf Büeze.ch und erhalten Sie passende Projektanfragen aus Ihrer Region – ohne Kosten pro Kontakt."'
)
WHERE page_key = 'handwerker-landing';

-- Update pricing page SEO
UPDATE page_content 
SET seo = jsonb_set(
  jsonb_set(seo, '{title}', '"Preise für Handwerker | Büeze.ch"'),
  '{description}', '"Einfache und faire Preise für Handwerksbetriebe. Starten Sie kostenlos mit 5 Offerten pro Monat oder wählen Sie ein Abo für unbegrenzte Projektanfragen."'
)
WHERE page_key = 'pricing';