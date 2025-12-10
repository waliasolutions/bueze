-- Fix misleading "we provide services" intro texts for major categories
-- Büeze.ch is a marketplace/portal, not a service provider

UPDATE page_content 
SET fields = jsonb_set(fields, '{intro}', '"Für sichere Elektroinstallationen braucht es Fachleute. Auf Büeze.ch finden Sie geprüfte Elektriker in der Schweiz – für Neubauten, Renovationen oder Notfälle. Alle Arbeiten erfolgen normgerecht und mit garantierter Sicherheit."')
WHERE page_key = 'major-elektroinstallationen';

UPDATE page_content 
SET fields = jsonb_set(fields, '{intro}', '"Vom tropfenden Wasserhahn bis zur kompletten Badsanierung: Finden Sie erfahrene Sanitärinstallateure in der ganzen Schweiz. Auch für Notfälle stehen Ihnen geprüfte Fachbetriebe zur Verfügung. Vergleichen Sie kostenlos mehrere Offerten."')
WHERE page_key = 'major-sanitaer';

UPDATE page_content 
SET fields = jsonb_set(fields, '{intro}', '"Eine zuverlässige Heizung ist das Herzstück jedes Zuhauses. Finden Sie zertifizierte Fachbetriebe für Heizungsinstallationen in der Schweiz – kompetent, schnell und fair. Von der Wartung bis zum Komplettersatz."')
WHERE page_key = 'major-heizung-klima';