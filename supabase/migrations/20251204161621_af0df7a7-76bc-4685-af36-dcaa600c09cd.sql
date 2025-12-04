-- Update homepage SEO
UPDATE page_content 
SET 
  seo = jsonb_set(
    jsonb_set(seo, '{title}', '"Handwerkermarktplatz in der Schweiz | Lokales Schweizer Handwerkerportal"'),
    '{description}', '"Finden Sie mit Bueeze vertrauenswürdige lokale Handwerker in der ganzen Schweiz. Unser Schweizer Handwerkerportal verbindet Sie mit kompetenten Fachleuten für Reparaturen, Renovierungen und Hausdienstleistungen. Schnell, zuverlässig und einfach zu bedienen."'
  ),
  updated_at = now()
WHERE page_key = 'homepage';

-- Update handwerker-landing SEO
UPDATE page_content 
SET 
  seo = jsonb_set(
    jsonb_set(seo, '{title}', '"Vergleichen Sie Handwerkerangebote und finden Sie sofort professionelle Handwerker"'),
    '{description}', '"Brauchen Sie Handwerker? Vergleichen Sie Handwerkerangebote und finden Sie sofort vertrauenswürdige, professionelle Handwerker auf Bueeze. Ideal für alle, die schnell und unkompliziert einen Handwerker beauftragen möchten."'
  ),
  updated_at = now()
WHERE page_key = 'handwerker-landing';

-- Update bau-renovation SEO and URL
UPDATE page_content 
SET 
  url = '/kategorien/bau-renovation',
  seo = jsonb_set(
    jsonb_set(
      jsonb_set(seo, '{title}', '"Hausrenovierung & Bauarbeiten in der Schweiz | Professionelle Handwerker"'),
      '{description}', '"Stellen Sie zuverlässige Bauhandwerker in der Schweiz für Renovierungs-, Umbau- und Bauprojekte ein. Entdecken Sie erstklassige Bau- und Renovierungsdienstleistungen auf Bueeze."'
    ),
    '{canonical}', '"https://bueeze.ch/kategorien/bau-renovation"'
  ),
  updated_at = now()
WHERE page_key = 'major-bau-renovation';

-- Update elektroinstallationen SEO and URL
UPDATE page_content 
SET 
  url = '/kategorien/elektroinstallationen',
  seo = jsonb_set(
    jsonb_set(
      jsonb_set(seo, '{title}', '"Elektrodienstleistungen in der Schweiz | Elektroinstallationen und elektrischer Notdienst"'),
      '{description}', '"Bueeze bietet professionelle Elektrodienstleistungen in der Schweiz, einschliesslich fachmännischer Elektroinstallationen und schnellem, zuverlässigem Notstromdienst. Vertrauen Sie unseren zertifizierten Elektrikern für sichere und effiziente Lösungen."'
    ),
    '{canonical}', '"https://bueeze.ch/kategorien/elektroinstallationen"'
  ),
  updated_at = now()
WHERE page_key = 'major-elektroinstallationen';

-- Update heizung-klima SEO and URL
UPDATE page_content 
SET 
  url = '/kategorien/heizung-klima',
  seo = jsonb_set(
    jsonb_set(
      jsonb_set(seo, '{title}', '"Heizung & Sanitär in der Schweiz | Professionelle Heizungsinstallationen"'),
      '{description}', '"Entdecken Sie mit Bueeze kompetente Heizungs- und Sanitärdienstleistungen in der Schweiz. Von effizienten Heizungsanlagen bis hin zu kompletten Klimalösungen bieten wir zuverlässige, moderne Systeme, die auf Ihr Zuhause oder Ihr Unternehmen zugeschnitten sind."'
    ),
    '{canonical}', '"https://bueeze.ch/kategorien/heizung-klima"'
  ),
  updated_at = now()
WHERE page_key = 'major-heizung-klima';

-- Update sanitaer SEO and URL
UPDATE page_content 
SET 
  url = '/kategorien/sanitaer',
  seo = jsonb_set(
    jsonb_set(
      jsonb_set(seo, '{title}', '"Sanitärservice in der Schweiz | Fachkundige Sanitärinstallationen"'),
      '{description}', '"Bueeze bietet zuverlässige Sanitärdienstleistungen in der Schweiz, einschliesslich hochwertiger Sanitärinstallationen für Privathaushalte und Unternehmen. Vertrauen Sie unserem Expertenteam für schnelle, professionelle Sanitärlösungen."'
    ),
    '{canonical}', '"https://bueeze.ch/kategorien/sanitaer"'
  ),
  updated_at = now()
WHERE page_key = 'major-sanitaer';