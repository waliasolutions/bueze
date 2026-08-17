UPDATE public.page_content
SET fields = jsonb_set(
  fields,
  '{quickLinks}',
  (
    SELECT jsonb_agg(item)
    FROM jsonb_array_elements(fields->'quickLinks') AS item
    WHERE item->>'label' != 'Alle Handwerker'
  )
)
WHERE page_key = 'homepage_footer';