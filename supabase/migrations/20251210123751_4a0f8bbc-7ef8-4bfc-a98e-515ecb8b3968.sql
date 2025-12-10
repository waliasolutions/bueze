-- Update kategorien-overview SEO with natural meta description
UPDATE page_content 
SET seo = jsonb_set(
  jsonb_set(seo, '{title}', '"Handwerker-Kategorien | Büeze.ch"'),
  '{description}', '"Von Elektroinstallationen über Sanitär bis zu Malerarbeiten – entdecken Sie alle Handwerksbereiche auf Büeze.ch und finden Sie den passenden Fachbetrieb für Ihr Projekt."'
)
WHERE page_key = 'kategorien-overview';