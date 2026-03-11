

# Updated Plan: Admin-Configurable Billing Settings + SSOT + Invoice Snapshot

## Changes from feedback

Two refinements incorporated:

**A. Snapshot passed as parameter, not re-read from DB**
In the initial invoice flow, `generate-invoice-pdf` writes the snapshot to the invoice record AND directly invokes `send-invoice-email`. Instead of `send-invoice-email` re-reading the snapshot from DB (race condition), the snapshot is passed as a parameter in the function invocation body. `send-invoice-email` only falls back to DB read for old invoices triggered externally (e.g., manual resend).

**B. Anon-readable view for public company data**
Legal pages and footer render before auth state resolves. A Postgres VIEW `billing_settings_public` exposes only non-sensitive fields (company name, address, website, phone, email) with an `anon` SELECT policy. The `useBillingSettings` hook queries this view. No flash-of-empty-content.

---

## Implementation plan

### 1. DB Migration

**Table**: `billing_settings` (single-row config, authenticated RLS for admin update)

```sql
CREATE TABLE public.billing_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL DEFAULT 'Büeze.ch',
  company_legal_name text NOT NULL DEFAULT 'Büeze.ch GmbH',
  company_street text NOT NULL DEFAULT 'Industriestrasse 28',
  company_zip text NOT NULL DEFAULT '9487',
  company_city text NOT NULL DEFAULT 'Gamprin-Bendern',
  company_country text NOT NULL DEFAULT 'Liechtenstein',
  company_email text NOT NULL DEFAULT 'info@bueeze.ch',
  company_phone text NOT NULL DEFAULT '+41 41 558 22 33',
  company_website text NOT NULL DEFAULT 'www.bueeze.ch',
  mwst_number text DEFAULT NULL,
  mwst_rate numeric NOT NULL DEFAULT 0,
  mwst_note text DEFAULT 'MWST befreit (Liechtenstein)',
  updated_at timestamptz DEFAULT now()
);
INSERT INTO public.billing_settings DEFAULT VALUES;
```

RLS: Admin can SELECT/UPDATE (authenticated + `has_role`). No public access on base table.

**View**: `billing_settings_public` — exposes only public fields, anon-readable:

```sql
CREATE VIEW public.billing_settings_public AS
  SELECT company_name, company_legal_name, company_street, company_zip,
         company_city, company_country, company_email, company_phone,
         company_website, mwst_number, mwst_rate, mwst_note
  FROM public.billing_settings LIMIT 1;
```

Grant `SELECT` to `anon` and `authenticated`.

**Invoice snapshot column**:

```sql
ALTER TABLE public.invoices ADD COLUMN billing_snapshot jsonb;
ALTER TABLE public.invoices ALTER COLUMN tax_rate SET DEFAULT 0;
```

### 2. Edge function: `_shared/companyConfig.ts` (new)

Default company values (same as DB defaults) as fallback constants. Helper `fetchBillingSettings(supabase)` that queries `billing_settings`, returns defaults on error.

### 3. Edge function: `_shared/invoicePdf.ts`

Remove hardcoded `COMPANY` constant. Accept company data as a new field in `InvoicePdfData` interface. Render sender address from passed-in data.

### 4. Edge function: `_shared/emailTemplates.ts`

`emailWrapper()` accepts optional company footer object parameter. Falls back to defaults from `companyConfig.ts`. Replaces hardcoded "Industriestrasse 28 | 9487 Gamprin-Bendern".

### 5. Edge function: `generate-invoice-pdf/index.ts`

Updated flow:
1. Fetch `billing_settings` from DB (fallback to defaults)
2. Calculate `taxRate` and `taxAmount` from `mwst_rate` setting (replaces hardcoded `0`)
3. Build `billingSnapshot` JSONB object from settings
4. Insert invoice with `billing_snapshot` column populated
5. Generate PDF using snapshot data (not live settings)
6. Upload PDF, update `pdf_storage_path`
7. Directly invoke `send-invoice-email` with `{ invoiceId, billingSnapshot }` as body — **snapshot passed as parameter**

### 6. Edge function: `send-invoice-email/index.ts`

- Accept optional `billingSnapshot` in request body
- If provided (initial send from generate-invoice-pdf): use it directly
- If not provided (manual resend, old trigger): read `billing_snapshot` from invoice record, fall back to live settings
- Pass company data to `emailWrapper()` / `invoiceEmailTemplate()`

### 7. Frontend: `src/hooks/useBillingSettings.ts` (new)

React Query hook querying `billing_settings_public` view. `staleTime: 30 min`. Returns typed object. Works for both anon and authenticated users.

### 8. Frontend: `src/contexts/BillingSettingsProvider.tsx` (new)

App-level context wrapping `useBillingSettings()`. Single fetch shared across all consumers via `useBillingContext()`.

### 9. Frontend consumers — replace hardcoded strings

| File | What changes |
|------|-------------|
| `Footer.tsx` | Use `useBillingContext()` for email, phone, address |
| `Impressum.tsx` | Use context for company name, address, contact |
| `Datenschutz.tsx` | Use context for 2 address blocks |
| `AGB.tsx` | Use context for 3 address references |
| `Checkout.tsx` | Read `mwst_rate` from context; show `mwst_note` when rate is 0 |
| `schemaHelpers.ts` | Accept company data as parameter (passed from calling components) |
| `contentDefaults.ts` | Remove `email`, `phone`, `address` from `footerDefaults` |

### 10. Admin UI

Add "Firmenangaben & Abrechnung" section in admin settings. Form for all `billing_settings` fields. Queries base table (authenticated admin). Same pattern as existing `useSiteSettings`.

### 11. Edge function cleanup: `siteConfig.ts`

Keep only `FRONTEND_URL` and `NOREPLY_EMAIL` (technical routing). Remove `SITE_NAME` and `SUPPORT_EMAIL` — sourced from `companyConfig.ts` defaults instead.

### 12. `supabase/config.toml`

Add missing entries:
```toml
[functions.generate-invoice-pdf]
verify_jwt = false

[functions.send-invoice-email]
verify_jwt = false

[functions.send-delivery-emails]
verify_jwt = false
```

---

## Rollout order

1. Migration (table + view + grants + snapshot column + tax default)
2. `_shared/companyConfig.ts` + updated `invoicePdf.ts` + `emailTemplates.ts`
3. `generate-invoice-pdf` + `send-invoice-email` (snapshot flow with parameter passing)
4. `config.toml` entries
5. Frontend: `BillingSettingsProvider` + hook + all component updates
6. Admin UI
7. `siteConfig.ts` cleanup

## Files summary

| File | Status |
|------|--------|
| Migration SQL | New |
| `supabase/functions/_shared/companyConfig.ts` | New |
| `supabase/functions/_shared/invoicePdf.ts` | Edit (remove COMPANY, accept param) |
| `supabase/functions/_shared/emailTemplates.ts` | Edit (parameterize footer) |
| `supabase/functions/generate-invoice-pdf/index.ts` | Edit (snapshot flow) |
| `supabase/functions/send-invoice-email/index.ts` | Edit (accept snapshot param) |
| `supabase/config.toml` | Edit (add 3 entries) |
| `src/hooks/useBillingSettings.ts` | New |
| `src/contexts/BillingSettingsProvider.tsx` | New |
| `src/components/Footer.tsx` | Edit |
| `src/pages/Checkout.tsx` | Edit |
| `src/pages/legal/Impressum.tsx` | Edit |
| `src/pages/legal/Datenschutz.tsx` | Edit |
| `src/pages/legal/AGB.tsx` | Edit |
| `src/lib/schemaHelpers.ts` | Edit |
| `src/config/contentDefaults.ts` | Edit |
| `supabase/functions/_shared/siteConfig.ts` | Edit |
| Admin settings page (new or existing) | Edit |

