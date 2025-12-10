UPDATE page_content 
SET fields = jsonb_set(fields, '{subIntro}', '"Unser Portal bringt Sie mit erfahrenen Handwerkern aus der ganzen Schweiz zusammen – für Reparaturen, Renovierungen und Projekte jeder Grösse."')
WHERE page_key = 'homepage_hero';