

# Fix Hauswartung Missing from Reinigung & Hauswartung Category

## Problem

Three issues identified:

1. **`reinigung_hauswartung` major category** only has `['reinigung']` in its subcategories array — missing `'reinigung_hauswartung'` (Hauswartung). So the landing page title says "Reinigung & Hauswartung" but only shows "Reinigung" as an option.

2. **`reinigung_hauswartung` subcategory is listed under `raeumung_entsorgung`** (line 245 of majorCategories.ts) — it should be under `reinigung_hauswartung` major category instead, since that's its natural home.

3. **Edge function mapping is out of sync** — `majorCategoryMapping.ts` has `reinigung_hauswartung: ['reinigung']` only, missing `'reinigung_hauswartung'`.

## Plan (3 files)

### 1. `src/config/majorCategories.ts`

- Add `'reinigung_hauswartung'` to the `reinigung_hauswartung` major category's subcategories: `['reinigung', 'reinigung_hauswartung']`
- Remove `'reinigung_hauswartung'` from `raeumung_entsorgung`'s subcategories (keep `aufloesung_entsorgung`, `umzug`, `reinigung`)

### 2. `supabase/functions/_shared/majorCategoryMapping.ts`

- Mirror the same change: add `'reinigung_hauswartung'` to `reinigung_hauswartung` array, remove from `raeumung_entsorgung`

### 3. `supabase/functions/_shared/subcategoryLabels.ts`

- Add `'reinigung_hauswartung': 'Hauswartung'` entry (currently missing from this edge-function-side labels file, breaking email display)

This ensures Hauswartung appears correctly in:
- Major category landing page (subcategory cards)
- Handwerker onboarding category selection
- Handwerkerverzeichnis browse/filter
- Lead submission form
- Backend lead-matching logic
- Email notifications

