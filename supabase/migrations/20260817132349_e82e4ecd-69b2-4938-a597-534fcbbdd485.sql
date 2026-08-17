update public.page_content
set fields = jsonb_set(
  fields,
  '{quickLinks}',
  (
    select jsonb_agg(
      case when l->>'href' = '/handwerker-verzeichnis'
        then jsonb_set(l, '{href}', '"/handwerker-verzeichnis?alle=1"')
        else l end
    )
    from jsonb_array_elements(fields->'quickLinks') l
  )
)
where page_key = 'homepage_footer'
  and fields->'quickLinks' is not null;