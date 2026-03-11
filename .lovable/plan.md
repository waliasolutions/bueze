

# Move "Maler" and "Gipser" to "Bau & Renovation" — Updated Plan

## Addressing Your Feedback

### 1. Cache Invalidation
This project uses **Vite + React SPA** deployed on **Vercel** — not Next.js/ISR. Vite produces fingerprinted asset filenames (e.g., `index-abc123.js`), so any code change automatically busts the cache. The `vercel.json` already sets `Cache-Control: immutable` only on hashed assets. No additional cache invalidation is needed.

### 2. Existing Database Payloads / JSONB Storage
Searched the entire codebase — there is **no** `lead_preferences` or `historical_matches` table. The parent category ID is **never stored** in any database column or JSONB field. Leads store only the leaf-level `category` enum value (e.g., `'maler'`), and handwerker profiles store categories as a `handwerker_category[]` array of enum values. The parent-to-child mapping exists only in config files. No data migration script is needed.

### 3. Active Leads During Deployment
The lead matching logic in `majorCategoryMapping.ts` works by mapping **subcategories to their parent**. An existing lead with `category = 'maler'` will still match correctly because:
- The `handwerkerMatchesCategory` function checks direct matches first (`handwerkerCategories.includes(leadCategory)`) — this still works
- Then it finds the subcategory's major category via `getMajorCategoryForSubcategory('maler')` — after the change this returns `'bau_renovation'` instead of `'innenausbau_schreiner'`, which means it will now match handwerkers with **any** `bau_renovation` subcategory (correct new behavior)
- Edge functions are deployed atomically, so there's no split-second where old code runs with new config

**One edge case**: A handwerker who selected `innenausbau_schreiner` as a major category (not `maler` specifically) would **stop** matching `maler` leads after this change. This is the **intended behavior** — Maler is no longer under Innenausbau.

## Changes (5 files)

### 1. `src/config/majorCategories.ts`
Add `'maler'` and `'gipser'` to `bau_renovation.subcategories` array (after `'renovierung_sonstige'`).

### 2. `src/config/subcategoryLabels.ts`
Change `majorCategoryId` from `'innenausbau_schreiner'` to `'bau_renovation'` for `maler` (line 455) and `gipser` (line 463).

### 3. `supabase/functions/_shared/majorCategoryMapping.ts`
Add `'maler'` and `'gipser'` to the `bau_renovation` array.

### 4. `supabase/functions/_shared/subcategoryLabels.ts`
Move `'maler'` and `'gipser'` label entries from the "Innenausbau & Schreiner" comment section to the "Bau & Renovation" comment section (cosmetic organization).

### 5. `supabase/functions/generate-sitemap/index.ts`
Move `'maler'` and `'gipser'` slugs from the Innenausbau line to the Bau & Renovation line.

No database migration needed. No cache invalidation needed. No data backfill needed.

