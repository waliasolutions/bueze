-- Update homepage_hero content to fix business logic text
UPDATE page_content 
SET fields = jsonb_set(
  jsonb_set(
    jsonb_set(fields, '{subtitle}', '"Erhalten Sie kostenlos mehrere Offerten von geprüften Handwerkern aus Ihrer Region."'),
    '{trustSignals}', '["Geprüfte Fachbetriebe schweizweit", "Kostenlos & unverbindlich für Auftraggeber", "Datenschutz - Kontaktdaten erst nach Zusage"]'
  ),
  '{badge}', '"Geprüfte Handwerker"'
)
WHERE page_key = 'homepage_hero';