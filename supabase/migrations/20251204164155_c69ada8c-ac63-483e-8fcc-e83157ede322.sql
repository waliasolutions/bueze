-- Update default meta tags to match homepage
UPDATE site_seo_settings 
SET 
  default_meta_title = 'Lokale Handwerker finden | Handwerker Schweiz | Büeze.ch',
  default_meta_description = 'Lokale Handwerker in der Schweiz finden. Kostenlos Offerten vergleichen, geprüfte Fachbetriebe kontaktieren. Schnell, einfach und zuverlässig.',
  updated_at = now()
WHERE id = '74ee426f-a80b-40bf-96ac-568775ac3e06';