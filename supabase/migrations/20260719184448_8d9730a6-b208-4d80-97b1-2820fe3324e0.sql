
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_year int := EXTRACT(YEAR FROM now() AT TIME ZONE 'Europe/Zurich')::int;
  v_next int;
BEGIN
  -- Lock invoices row range for the year to make numbering safe under concurrency.
  PERFORM 1 FROM public.invoices
   WHERE invoice_number LIKE 'BE-' || v_year || '-%'
   ORDER BY invoice_number DESC
   FOR UPDATE;

  SELECT COALESCE(MAX(
           NULLIF(regexp_replace(invoice_number, '^BE-' || v_year || '-', ''), '')::int
         ), 0) + 1
    INTO v_next
    FROM public.invoices
   WHERE invoice_number LIKE 'BE-' || v_year || '-%';

  RETURN 'BE-' || v_year || '-' || LPAD(v_next::text, 6, '0');
END;
$function$;

REVOKE ALL ON FUNCTION public.generate_invoice_number() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_invoice_number() TO service_role;
