

# Handwerkerverzeichnis Browse Layer + Footer CTA

## What Changes

### 1. HandwerkerVerzeichnis: Add browse landing layer before results

Inspired by the renovero screenshot, the page will show a **two-phase UI**:

**Phase 1 (Landing/Browse layer)** — shown when no canton or category is selected:
- Search bar with "Suchen" button (matching renovero style)
- **Kantone** section: all 26 Swiss cantons as clickable badge/chips (using `SWISS_CANTONS` SSOT from `cantons.ts`)
- **Alle Kategorien** section: all major categories with their subcategories as clickable links in a multi-column grid (using `majorCategories` + `subcategoryLabels` SSOT)
- Clicking a canton or category sets the filter and transitions to Phase 2

**Phase 2 (Results)** — shown when a filter is active (current behavior, mostly unchanged):
- Filter bar with active selections
- Handwerker cards grid
- "Back to browse" link to return to Phase 1

This is a simple state toggle (`showResults`) — no new routes needed. Data is fetched once on mount (existing behavior).

### 2. Navigation: Remove "Handwerker finden" from client nav

**File: `src/config/navigation.ts`**
- Remove the `{ label: 'Handwerker finden', href: '/handwerker-verzeichnis', icon: Users }` entry from `roleNavigation.client`

### 3. Footer: Add standalone CTA button

**File: `src/components/Footer.tsx`**
- Add a "Handwerker finden" CTA button (Link to `/handwerker-verzeichnis`) in the footer bottom section, above the copyright line
- Styled as a visible button (brand colors), not a text link

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/HandwerkerVerzeichnis.tsx` | Add browse layer with cantons grid + categories grid; toggle to results on filter selection |
| `src/config/navigation.ts` | Remove "Handwerker finden" from client navigation |
| `src/components/Footer.tsx` | Add "Handwerker finden" CTA button |

No new files, no new dependencies. All data sourced from existing SSOT configs (`cantons.ts`, `majorCategories.ts`, `subcategoryLabels.ts`, `categoryLabels.ts`).

