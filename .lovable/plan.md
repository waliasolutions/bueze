

# Update Company Name & Address Everywhere

## What's Changing

| Field | Old | New |
|-------|-----|-----|
| Company name | Büeze GmbH | Büeze.ch GmbH |
| Street | Gotthardstrasse 37 | Industriestrasse 28 |
| City/Postal | 6410 Goldau | 9487 Gamprin-Bendern |
| Country | Schweiz (CH) | Liechtenstein (LI) |
| Handelsregister | Kanton Schwyz | Liechtenstein |
| Gerichtsstand | Schwyz, Schweiz | Gamprin-Bendern, Liechtenstein |
| addressRegion (SEO) | SZ / Schwyz | - (Liechtenstein has no cantons) |

## Files to Update (10 files total)

### Frontend Pages (4 files)
1. **`src/components/Footer.tsx`** -- Address line + copyright name
2. **`src/pages/legal/Impressum.tsx`** -- Company name, address, meta description, Handelsregister, Gerichtsstand, schema text
3. **`src/pages/legal/Datenschutz.tsx`** -- Company name + address in 2 locations (section 1 + section 13), meta description
4. **`src/pages/legal/AGB.tsx`** -- Company name + address in intro + contact section, Gerichtsstand

### SEO / Schema (2 files)
5. **`src/lib/schemaHelpers.ts`** -- Organization + LocalBusiness schemas: streetAddress, addressLocality, postalCode, addressRegion, addressCountry
6. **`index.html`** -- `meta author` tag

### Email Templates (4 edge function files)
7. **`supabase/functions/_shared/emailTemplates.ts`** -- Footer block
8. **`supabase/functions/send-subscription-confirmation/index.ts`** -- Footer block
9. **`supabase/functions/send-rating-reminder/index.ts`** -- Footer block
10. **`supabase/functions/send-proposal-rejection-email/index.ts`** -- Footer block

## What Stays the Same
- Email: info@bueeze.ch (unchanged)
- Phone: +41 41 558 22 33 (unchanged)
- UID: CHE-389.446.099 (unchanged -- Swiss UIDs remain valid for LI-registered companies)
- Website URL: bueeze.ch (unchanged)
- `src/config/cantons.ts` -- unrelated reference data, not company info

## Technical Details

All changes are simple string replacements. The edge function files will be redeployed after editing. No database migration needed -- this is purely display/content.

### Replacement Map (applied consistently)

```text
"Büeze GmbH"           -->  "Büeze.ch GmbH"
"Gotthardstrasse 37"   -->  "Industriestrasse 28"
"6410 Goldau"          -->  "9487 Gamprin-Bendern"
"Schweiz" (country)    -->  "Liechtenstein"
"Kanton Schwyz"        -->  "Liechtenstein"
"Schwyz, Schweiz"      -->  "Gamprin-Bendern, Liechtenstein"
addressCountry: "CH"   -->  "LI"
addressRegion: "SZ"    -->  removed (N/A for LI)
```

