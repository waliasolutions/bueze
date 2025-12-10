UPDATE page_content 
SET 
  fields = jsonb_set(fields, '{intro}', '"Eine neue Küche ist eine langfristige Investiment in Lebensqualität. Finden Sie erfahrene Küchenbauer in der Schweiz für Planung, Montage und Renovation. Von der ersten Idee bis zur fertigen Traumküche – vergleichen Sie kostenlos Offerten von Fachbetrieben."'),
  seo = jsonb_build_object(
    'title', 'Küche | Küchenbau & Planung Schweiz | Büeze.ch',
    'description', 'Küchenbau und Küchenrenovation in der Schweiz. Planung, Montage und Geräte-Installation. Jetzt Offerten vergleichen.',
    'canonical', 'https://bueeze.ch/kategorien/kueche',
    'robots', 'index, follow'
  )
WHERE page_key = 'major-kueche';