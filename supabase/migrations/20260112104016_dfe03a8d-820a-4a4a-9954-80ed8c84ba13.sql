-- Update homepage_hero content to match SEO-optimized defaults (SSOT)
UPDATE public.page_content 
SET 
  fields = jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          fields,
          '{title}',
          '"Handwerker in der Schweiz finden und Offerten vergleichen"'
        ),
        '{subtitle}',
        '"Ihr lokaler Handwerker-Marktplatz für die ganze Schweiz"'
      ),
      '{subIntro}',
      '"Unser Portal bringt Sie mit erfahrenen Handwerkern aus der ganzen Schweiz zusammen – für Reparaturen, Renovierungen und Projekte jeder Grösse."'
    ),
    '{ctaText}',
    '"Jetzt starten"'
  ),
  updated_at = now()
WHERE page_key = 'homepage_hero';

-- Also update homepage SEO data to match
UPDATE public.page_content 
SET 
  seo = jsonb_set(
    jsonb_set(
      COALESCE(seo, '{}')::jsonb,
      '{title}',
      '"Handwerker finden in der Schweiz | Kostenlose Offerten | Büeze.ch"'
    ),
    '{description}',
    '"Ihr Schweizer Marktplatz für geprüfte Handwerker. Beschreiben Sie Ihr Projekt und erhalten Sie kostenlos bis zu 3 Offerten von Fachbetrieben aus Ihrer Region. Jetzt starten!"'
  ),
  updated_at = now()
WHERE page_key = 'homepage';