-- Add new columns to page_content table for better organization
ALTER TABLE page_content 
ADD COLUMN IF NOT EXISTS url TEXT,
ADD COLUMN IF NOT EXISTS page_type TEXT;

-- Update existing legal pages with url and page_type
UPDATE page_content 
SET url = '/impressum', page_type = 'legal' 
WHERE page_key = 'legal_imprint';

UPDATE page_content 
SET url = '/datenschutz', page_type = 'legal' 
WHERE page_key = 'legal_privacy';

UPDATE page_content 
SET url = '/agb', page_type = 'legal' 
WHERE page_key = 'legal_terms';

-- Insert Homepage
INSERT INTO page_content (page_key, url, page_type, content_type, seo, status, fields)
VALUES (
  'homepage',
  '/',
  'homepage',
  'homepage',
  '{"title": "Handwerker Marktplatz Schweiz | Lokaler Handwerker Finden | Büeze.ch", "description": "Handwerker Portal für die Schweiz. Finden Sie lokale Handwerker in Ihrer Region. Kostenlos mehrere Angebote vergleichen. Handwerker Schweiz – professionell und geprüft.", "canonical": "https://bueeze.ch/", "robots": "index, follow"}'::jsonb,
  'published',
  '{}'::jsonb
) ON CONFLICT (page_key) DO UPDATE SET
  url = EXCLUDED.url,
  page_type = EXCLUDED.page_type,
  seo = EXCLUDED.seo;

-- Insert Handwerker Landing
INSERT INTO page_content (page_key, url, page_type, content_type, seo, status, fields)
VALUES (
  'handwerker-landing',
  '/handwerker',
  'handwerker',
  'homepage',
  '{"title": "Handwerker finden sofort | Aufträge für Handwerker | Handwerker Angebote", "description": "Handwerker finden sofort – erhalten Sie Aufträge für Handwerker und vergleichen Sie Handwerker Angebote. Kostenlose Registrierung für Handwerksbetriebe.", "canonical": "https://bueeze.ch/handwerker", "robots": "index, follow"}'::jsonb,
  'published',
  '{}'::jsonb
) ON CONFLICT (page_key) DO UPDATE SET
  url = EXCLUDED.url,
  page_type = EXCLUDED.page_type,
  seo = EXCLUDED.seo;

-- Insert Kategorien Overview
INSERT INTO page_content (page_key, url, page_type, content_type, seo, status, fields)
VALUES (
  'kategorien-overview',
  '/kategorien',
  'other',
  'homepage',
  '{"title": "Alle Handwerk-Kategorien | Handwerker Schweiz | Büeze.ch", "description": "Übersicht aller Handwerk-Kategorien. Finden Sie qualifizierte Handwerker in der Schweiz für Ihr Projekt. Kostenlos Offerten vergleichen.", "canonical": "https://bueeze.ch/kategorien", "robots": "index, follow"}'::jsonb,
  'published',
  '{}'::jsonb
) ON CONFLICT (page_key) DO UPDATE SET
  url = EXCLUDED.url,
  page_type = EXCLUDED.page_type,
  seo = EXCLUDED.seo;

-- Insert Pricing Page
INSERT INTO page_content (page_key, url, page_type, content_type, seo, status, fields)
VALUES (
  'pricing',
  '/pricing',
  'other',
  'homepage',
  '{"title": "Preise & Abonnements | Handwerker Portal | Büeze.ch", "description": "Transparente Preise für Handwerksbetriebe. Wählen Sie das passende Abo und erhalten Sie Zugang zu Aufträgen in Ihrer Region.", "canonical": "https://bueeze.ch/pricing", "robots": "index, follow"}'::jsonb,
  'published',
  '{}'::jsonb
) ON CONFLICT (page_key) DO UPDATE SET
  url = EXCLUDED.url,
  page_type = EXCLUDED.page_type,
  seo = EXCLUDED.seo;

-- Insert 10 Major Category Pages
INSERT INTO page_content (page_key, url, page_type, content_type, seo, status, fields)
VALUES 
  (
    'major-bau-renovation',
    '/kategorie/bau-renovation',
    'major_category',
    'category',
    '{"title": "Bauarbeiter Schweiz | Bauhandwerker | Hausrenovation Schweiz | Büeze.ch", "description": "Bauarbeiter in der Schweiz finden. Professionelle Bauhandwerker für Hausrenovation in der Schweiz. Kostenlos Offerten vergleichen.", "canonical": "https://bueeze.ch/kategorie/bau-renovation", "robots": "index, follow"}'::jsonb,
    'published',
    '{"intro": "Sie planen eine Hausrenovation in der Schweiz? Finden Sie erfahrene Bauarbeiter und Bauhandwerker in Ihrer Region. Von der Planung bis zur Umsetzung begleiten Sie qualifizierte Fachleute durch Ihr Bauprojekt. Vergleichen Sie kostenlos mehrere Offerten von geprüften Baufachbetrieben."}'::jsonb
  ),
  (
    'major-elektroinstallationen',
    '/kategorie/elektroinstallationen',
    'major_category',
    'category',
    '{"title": "Elektrik Service Schweiz | Elektroinstallationen | Elektriker Schweiz", "description": "Elektrik Service in der Schweiz. Professionelle Elektroinstallationen von geprüften Elektrikern. Kostenlos mehrere Offerten einholen.", "canonical": "https://bueeze.ch/kategorie/elektroinstallationen", "robots": "index, follow"}'::jsonb,
    'published',
    '{"intro": "Für sichere Elektroinstallationen braucht es Fachleute. Unser Elektrik Service verbindet Sie mit geprüften Elektrikern in der Schweiz – für Neubauten, Renovationen oder Notfälle. Alle Arbeiten erfolgen normgerecht und mit garantierter Sicherheit."}'::jsonb
  ),
  (
    'major-heizung-klima',
    '/kategorie/heizung-klima',
    'major_category',
    'category',
    '{"title": "Heizung & Sanitär Schweiz | Heizungsinstallationen | Büeze.ch", "description": "Heizung & Sanitär Service in der Schweiz. Professionelle Heizungsinstallationen von zertifizierten Fachbetrieben.", "canonical": "https://bueeze.ch/kategorie/heizung-klima", "robots": "index, follow"}'::jsonb,
    'published',
    '{"intro": "Eine zuverlässige Heizung ist das Herzstück jedes Zuhauses. Finden Sie zertifizierte Fachbetriebe für Heizungsinstallationen und Heizung & Sanitär Service in der Schweiz – kompetent, schnell und fair. Von der Wartung bis zum Komplettersatz."}'::jsonb
  ),
  (
    'major-sanitaer',
    '/kategorie/sanitaer',
    'major_category',
    'category',
    '{"title": "Sanitär Service Schweiz | Sanitärinstallationen | Sanitär Notdienst", "description": "Sanitär Service in der Schweiz. Zuverlässige Sanitärinstallationen und Notdienst. Mehrere Offerten kostenlos vergleichen.", "canonical": "https://bueeze.ch/kategorie/sanitaer", "robots": "index, follow"}'::jsonb,
    'published',
    '{"intro": "Vom tropfenden Wasserhahn bis zur kompletten Badsanierung: Unser Sanitär Service verbindet Sie mit erfahrenen Profis für Sanitärinstallationen in der ganzen Schweiz. Auch im Notfall sind wir für Sie da. Vergleichen Sie kostenlos mehrere Offerten."}'::jsonb
  ),
  (
    'major-innenausbau-schreiner',
    '/kategorie/innenausbau-schreiner',
    'major_category',
    'category',
    '{"title": "Innenausbau & Schreiner | Schreinerarbeiten Schweiz | Büeze.ch", "description": "Professionelle Schreinerarbeiten und Innenausbau in der Schweiz. Finden Sie erfahrene Schreiner für Ihr Projekt. Kostenlos Offerten vergleichen.", "canonical": "https://bueeze.ch/kategorie/innenausbau-schreiner", "robots": "index, follow"}'::jsonb,
    'published',
    '{"intro": "Qualität im Detail – das zeichnet gute Schreinerarbeiten aus. Ob Möbelbau, Fenster oder Türen: Finden Sie erfahrene Schreiner für Innenausbau in der Schweiz. Vergleichen Sie kostenlos Offerten von Fachbetrieben."}'::jsonb
  ),
  (
    'major-bodenbelaege',
    '/kategorie/bodenbelaege',
    'major_category',
    'category',
    '{"title": "Bodenbeläge Schweiz | Bodenleger | Parkett & Laminat | Büeze.ch", "description": "Bodenbeläge in der Schweiz verlegen lassen. Professionelle Bodenleger für Parkett, Laminat und mehr. Kostenlos Offerten vergleichen.", "canonical": "https://bueeze.ch/kategorie/bodenbelaege", "robots": "index, follow"}'::jsonb,
    'published',
    '{"intro": "Der richtige Bodenbelag macht den Unterschied. Finden Sie professionelle Bodenleger in der Schweiz für Parkett, Laminat, Vinyl und mehr. Vergleichen Sie kostenlos Offerten von erfahrenen Fachbetrieben."}'::jsonb
  ),
  (
    'major-kueche-bad',
    '/kategorie/kueche-bad',
    'major_category',
    'category',
    '{"title": "Küche & Bad | Küchenbau Schweiz | Badsanierung | Büeze.ch", "description": "Küchenbau und Badsanierung in der Schweiz. Professionelle Fachbetriebe für Küche & Bad. Kostenlos mehrere Offerten einholen.", "canonical": "https://bueeze.ch/kategorie/kueche-bad", "robots": "index, follow"}'::jsonb,
    'published',
    '{"intro": "Küche und Bad sind die wichtigsten Räume im Haus. Finden Sie Fachbetriebe für Küchenbau und Badsanierung in der Schweiz. Von der Planung bis zur Ausführung – vergleichen Sie kostenlos Offerten."}'::jsonb
  ),
  (
    'major-garten-aussenbereich',
    '/kategorie/garten-aussenbereich',
    'major_category',
    'category',
    '{"title": "Garten & Aussenbereich | Gartenbau Schweiz | Landschaftsbau | Büeze.ch", "description": "Gartenbau und Landschaftsbau in der Schweiz. Professionelle Gartenbauer für Ihren Aussenbereich. Kostenlos Offerten vergleichen.", "canonical": "https://bueeze.ch/kategorie/garten-aussenbereich", "robots": "index, follow"}'::jsonb,
    'published',
    '{"intro": "Ein gepflegter Garten ist Lebensqualität. Finden Sie professionelle Gartenbauer in der Schweiz für Landschaftsbau, Gartengestaltung und mehr. Vergleichen Sie kostenlos Offerten von erfahrenen Fachbetrieben."}'::jsonb
  ),
  (
    'major-raeumung-entsorgung',
    '/kategorie/raeumung-entsorgung',
    'major_category',
    'category',
    '{"title": "Räumung & Entsorgung | Entrümpelungsdienst Schweiz | Büeze.ch", "description": "Räumung und Entsorgung in der Schweiz. Professionelle Entrümpelungsdienste für Wohnung, Haus und Betrieb. Kostenlos Offerten vergleichen.", "canonical": "https://bueeze.ch/kategorie/raeumung-entsorgung", "robots": "index, follow"}'::jsonb,
    'published',
    '{"intro": "Professionelle Räumung und fachgerechte Entsorgung. Finden Sie zuverlässige Entrümpelungsdienste in der Schweiz für Wohnungen, Häuser und Betriebe. Vergleichen Sie kostenlos Offerten."}'::jsonb
  ),
  (
    'major-sonstige-handwerkerleistungen',
    '/kategorie/sonstige-handwerkerleistungen',
    'major_category',
    'category',
    '{"title": "Sonstige Handwerkerleistungen | Handwerker Schweiz | Büeze.ch", "description": "Weitere Handwerkerleistungen in der Schweiz. Finden Sie qualifizierte Handwerker für vielfältige Projekte. Kostenlos Offerten vergleichen.", "canonical": "https://bueeze.ch/kategorie/sonstige-handwerkerleistungen", "robots": "index, follow"}'::jsonb,
    'published',
    '{"intro": "Ihr Projekt passt in keine Standardkategorie? Finden Sie Handwerker in der Schweiz für vielfältige Leistungen. Vergleichen Sie kostenlos Offerten von erfahrenen Fachbetrieben."}'::jsonb
  )
ON CONFLICT (page_key) DO UPDATE SET
  url = EXCLUDED.url,
  page_type = EXCLUDED.page_type,
  seo = EXCLUDED.seo,
  fields = EXCLUDED.fields;