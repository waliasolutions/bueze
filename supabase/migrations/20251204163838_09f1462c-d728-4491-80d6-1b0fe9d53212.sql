-- Update homepage - shorter, action-focused
UPDATE page_content 
SET seo = jsonb_set(seo, '{description}', '"Lokale Handwerker in der Schweiz finden. Kostenlos Offerten vergleichen, geprüfte Fachbetriebe kontaktieren. Schnell, einfach und zuverlässig."')
WHERE page_key = 'homepage';

-- Update handwerker-landing - more concise
UPDATE page_content 
SET seo = jsonb_set(seo, '{description}', '"Handwerkerangebote vergleichen und den passenden Profi finden. Geprüfte Handwerker, transparente Offerten, schnelle Vermittlung auf Büeze.ch."')
WHERE page_key = 'handwerker-landing';

-- Update kategorien-overview
UPDATE page_content 
SET seo = jsonb_set(seo, '{description}', '"Alle Handwerk-Kategorien auf einen Blick. Finden Sie Elektriker, Sanitär, Maler und mehr. Kostenlos Offerten von geprüften Handwerkern einholen."')
WHERE page_key = 'kategorien-overview';

-- Update pricing
UPDATE page_content 
SET seo = jsonb_set(seo, '{description}', '"Transparente Preise für Handwerker auf Büeze.ch. Wählen Sie Ihr Abo und erhalten Sie Zugang zu Aufträgen in Ihrer Region."')
WHERE page_key = 'pricing';

-- Update major-bau-renovation
UPDATE page_content 
SET seo = jsonb_set(seo, '{description}', '"Bauarbeiten und Renovierung in der Schweiz. Geprüfte Handwerker für Umbau, Sanierung und Neubau. Kostenlos Offerten vergleichen."')
WHERE page_key = 'major-bau-renovation';

-- Update major-elektroinstallationen
UPDATE page_content 
SET seo = jsonb_set(seo, '{description}', '"Elektriker in der Schweiz finden. Hausinstallationen, E-Mobilität, Smart Home und mehr. Kostenlos Offerten von geprüften Elektrikern einholen."')
WHERE page_key = 'major-elektroinstallationen';

-- Update major-heizung-klima
UPDATE page_content 
SET seo = jsonb_set(seo, '{description}', '"Heizung und Klima in der Schweiz. Wärmepumpen, Photovoltaik, Klimaanlagen installieren. Kostenlos Offerten von Fachbetrieben vergleichen."')
WHERE page_key = 'major-heizung-klima';

-- Update major-sanitaer
UPDATE page_content 
SET seo = jsonb_set(seo, '{description}', '"Sanitär-Fachbetriebe in der Schweiz finden. Badezimmer, Klempnerarbeiten, Boiler-Installation. Kostenlos Offerten vergleichen auf Büeze.ch."')
WHERE page_key = 'major-sanitaer';

-- Update major-bodenbelaege - fix URL to /kategorien/
UPDATE page_content 
SET seo = jsonb_set(seo, '{description}', '"Bodenbeläge verlegen lassen in der Schweiz. Parkett, Laminat, Fliesen von geprüften Bodenlegern. Kostenlos Offerten einholen."'),
    url = '/kategorien/bodenbelaege'
WHERE page_key = 'major-bodenbelaege';

-- Update major-innenausbau-schreiner - fix URL
UPDATE page_content 
SET seo = jsonb_set(seo, '{description}', '"Schreiner und Innenausbau in der Schweiz. Möbel, Fenster, Türen, Treppen von geprüften Fachbetrieben. Kostenlos Offerten vergleichen."'),
    url = '/kategorien/innenausbau-schreiner'
WHERE page_key = 'major-innenausbau-schreiner';

-- Update major-kueche-bad - fix URL
UPDATE page_content 
SET seo = jsonb_set(seo, '{description}', '"Küchenbau und Badsanierung in der Schweiz. Küchenplanung, Badezimmer-Umbau von Fachbetrieben. Kostenlos Offerten einholen."'),
    url = '/kategorien/kueche-bad'
WHERE page_key = 'major-kueche-bad';

-- Update major-garten-aussenbereich - fix URL
UPDATE page_content 
SET seo = jsonb_set(seo, '{description}', '"Gartenbau und Aussenbereich in der Schweiz. Gartengestaltung, Zaunbau, Pflasterarbeiten. Kostenlos Offerten von Fachbetrieben einholen."'),
    url = '/kategorien/garten-aussenbereich'
WHERE page_key = 'major-garten-aussenbereich';

-- Update major-raeumung-entsorgung - fix URL
UPDATE page_content 
SET seo = jsonb_set(seo, '{description}', '"Räumung und Entsorgung in der Schweiz. Wohnungsräumung, Entrümpelung, Baureinigung. Kostenlos Offerten von Fachbetrieben vergleichen."'),
    url = '/kategorien/raeumung-entsorgung'
WHERE page_key = 'major-raeumung-entsorgung';

-- Update major-sonstige-handwerkerleistungen - fix URL
UPDATE page_content 
SET seo = jsonb_set(seo, '{description}', '"Weitere Handwerkerleistungen in der Schweiz. Finden Sie geprüfte Fachbetriebe für Ihr spezielles Projekt. Kostenlos Offerten einholen."'),
    url = '/kategorien/sonstige-handwerkerleistungen'
WHERE page_key = 'major-sonstige-handwerkerleistungen';