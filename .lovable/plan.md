## Problem

The Impressum page shows "Geschäftsführung: MHS Haustechnik GmbH" — a hardcoded reference to a company that no longer exists. It should reflect Büeze.ch GmbH.

## Deep QA result

Full repo grep for `MHS` and `Haustechnik` (case-insensitive) returns exactly one hit:

- `src/pages/legal/Impressum.tsx:91`

No other mentions exist anywhere in the codebase (frontend, edge functions, migrations, HTML export, docs, config).

## Change

In `src/pages/legal/Impressum.tsx` line 91, replace the hardcoded string with the SSOT value from `billing_settings` (already available as `b.company_legal_name` on this page, used one line below for the same entity):

```text
- <p><strong>Geschäftsführung:</strong> MHS Haustechnik GmbH</p>
+ <p><strong>Geschäftsführung:</strong> {b.company_legal_name}</p>
```

This resolves to "Büeze.ch GmbH" (per billing settings SSOT) and prevents future drift if the legal name is ever updated in admin billing settings.

## Notes

- No DB, edge function, or email template changes needed.
- No other files reference MHS Haustechnik.
