

# Add MwSt Mode: "none" (hide completely) vs "exclusive" (add on top)

## Current State
- `billing_settings` has `mwst_rate` (numeric) and `mwst_note` (text), but no concept of "mode"
- The PDF always shows MwSt line (even when rate is 0, it shows "MWST (befreit)")
- `generate-invoice-pdf` always calculates tax as part of the total
- Current logic: if `mwst_rate > 0`, tax is extracted from the amount (inclusive); if 0, no tax

## What Needs to Change

### 1. Database: Add `mwst_mode` column to `billing_settings`
- New column `mwst_mode text NOT NULL DEFAULT 'none'` with values:
  - `'none'` -- No MwSt at all. No MwSt line on PDF, no MwSt in email, no MwSt number shown. Amount = net = total.
  - `'exclusive'` -- MwSt is added on top. Net amount stays as-is, tax is calculated on top, total = net + tax.
- Update the `billing_settings_public` view to include this column.

### 2. Admin UI: `AdminBillingSettings.tsx`
- Add a MwSt-Modus dropdown (None / Exklusiv) to the tax settings card.
- When "none" is selected, grey out the rate/number/note fields (they become irrelevant).

### 3. Edge Function: `generate-invoice-pdf`
- When `mwst_mode === 'none'`: `netAmount = amount`, `taxAmount = 0`, no tax calculation.
- When `mwst_mode === 'exclusive'`: `netAmount = amount`, `taxAmount = round(amount * rate / 100)`, `totalAmount = amount + taxAmount`. The payment amount from Payrexx should already include tax in this mode, so the function needs to treat the incoming `amount` as net and add tax on top.

### 4. PDF: `invoicePdf.ts`
- When `mwst_mode === 'none'`: Skip the "Zwischensumme" + "MWST" lines entirely. Show only the Total. Don't show MwSt number in header.
- When `mwst_mode === 'exclusive'`: Show Zwischensumme (net), MwSt line with rate, and Total (net + tax).

### 5. `BillingSettings` interface + snapshot
- Add `mwst_mode` to the `BillingSettings` interface in `companyConfig.ts` (default `'none'`).
- The snapshot captures the mode at invoice time, ensuring historical invoices render correctly.

### 6. Email template: minor
- No MwSt-specific content in the current email template (just shows total amount), so no changes needed there.

## Files to Edit
- **Migration**: Add `mwst_mode` column + update view
- `supabase/functions/_shared/companyConfig.ts` -- add `mwst_mode` to interface + defaults
- `supabase/functions/_shared/invoicePdf.ts` -- conditional MwSt rendering
- `supabase/functions/generate-invoice-pdf/index.ts` -- tax calculation based on mode
- `src/pages/admin/AdminBillingSettings.tsx` -- add mode selector

