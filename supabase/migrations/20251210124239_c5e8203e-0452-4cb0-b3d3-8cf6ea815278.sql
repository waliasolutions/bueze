-- Update all 10 major category pages with natural meta descriptions

UPDATE page_content 
SET seo = jsonb_set(seo, '{description}', '"Sie planen einen Umbau oder eine Renovation? Auf Büeze.ch finden Sie Bauhandwerker aus Ihrer Region und können kostenlos mehrere Offerten vergleichen."')
WHERE page_key = 'major-bau-renovation';

UPDATE page_content 
SET seo = jsonb_set(seo, '{description}', '"Ob Hausinstallation, Ladestation oder Smart Home – finden Sie den richtigen Elektriker für Ihr Projekt und vergleichen Sie kostenlos Offerten."')
WHERE page_key = 'major-elektroinstallationen';

UPDATE page_content 
SET seo = jsonb_set(seo, '{description}', '"Sie brauchen eine neue Heizung oder Klimaanlage? Finden Sie Installateure aus Ihrer Region und vergleichen Sie kostenlos mehrere Offerten."')
WHERE page_key = 'major-heizung-klima';

UPDATE page_content 
SET seo = jsonb_set(seo, '{description}', '"Vom neuen Badezimmer bis zur Rohrreparatur – finden Sie Sanitärinstallateure in Ihrer Nähe und holen Sie kostenlos Offerten ein."')
WHERE page_key = 'major-sanitaer';

UPDATE page_content 
SET seo = jsonb_set(seo, '{description}', '"Parkett, Fliesen oder Vinyl? Finden Sie erfahrene Bodenleger für Ihr Projekt und vergleichen Sie kostenlos verschiedene Offerten."')
WHERE page_key = 'major-bodenbelaege';

UPDATE page_content 
SET seo = jsonb_set(seo, '{description}', '"Massanfertigung oder Standardlösung? Finden Sie Schreiner und Innenausbau-Spezialisten und lassen Sie sich kostenlos beraten."')
WHERE page_key = 'major-innenausbau-schreiner';

UPDATE page_content 
SET seo = jsonb_set(seo, '{description}', '"Neue Küche geplant? Finden Sie erfahrene Küchenbauer für Planung und Montage und vergleichen Sie kostenlos mehrere Offerten."')
WHERE page_key = 'major-kueche';

UPDATE page_content 
SET seo = jsonb_set(seo, '{description}', '"Vom Gartenbau bis zur Terrassengestaltung – finden Sie Profis für Ihren Aussenbereich und vergleichen Sie kostenlos Offerten."')
WHERE page_key = 'major-garten-aussenbereich';

UPDATE page_content 
SET seo = jsonb_set(seo, '{description}', '"Haushaltsauflösung oder Entrümpelung? Finden Sie zuverlässige Räumungsdienste und vergleichen Sie kostenlos mehrere Angebote."')
WHERE page_key = 'major-raeumung-entsorgung';

UPDATE page_content 
SET seo = jsonb_set(seo, '{description}', '"Ihr Projekt passt in keine Standardkategorie? Beschreiben Sie Ihr Vorhaben und finden Sie den passenden Handwerker."')
WHERE page_key = 'major-sonstige-handwerkerleistungen';