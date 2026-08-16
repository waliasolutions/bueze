ALTER VIEW public.handwerker_profiles_public SET (security_invoker = false);
COMMENT ON VIEW public.handwerker_profiles_public IS
  'Sanctioned public read path for approved handwerker profiles. Intentionally runs with the view owner''s privileges (security_invoker=false) so the base table stays unreadable to anon/authenticated. Exposes only non-sensitive business fields: never iban, bank_name, tax_id, uid_number, mwst_number or personal_* address columns.';
COMMENT ON VIEW public.billing_settings_public IS
  'Sanctioned public read path for company billing/imprint data. Intentionally security_invoker=false; exposes only legally required imprint fields.';