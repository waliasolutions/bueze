

# Show Maler & Gipser in Handwerkerverzeichnis

## Root Cause

`HandwerkerVerzeichnis.tsx` builds its category lists dynamically from handwerker data in the database. Two locations filter categories this way:

1. **BrowseLayer** (line 207): `availableCategories` is a `Set` built from `handwerkers.flatMap(hw => hw.categories)`. Subcategories only appear if at least one handwerker has them.
2. **ResultsLayer** (line 301): `allCategories` is built the same way from `handwerkers.flatMap(hw => hw.categories)`.

Since no handwerker currently has `maler` or `gipser` in their profile, these categories are invisible.

## Fix (1 file)

### `src/pages/HandwerkerVerzeichnis.tsx`

**BrowseLayer** -- Remove the `availableCategories.has(subId)` filter so all subcategories from `majorCategories` config are shown:

```tsx
// Line 206-207: Change from
const subs = category.subcategories
  .filter(subId => availableCategories.has(subId))
  .map(subId => subcategoryLabels[subId])

// To
const subs = category.subcategories
  .map(subId => subcategoryLabels[subId])
```

Remove the `availableCategories` prop from `BrowseLayer` and its computation in the parent (keep `availableCantons` as-is since canton filtering by data availability makes sense).

**ResultsLayer** -- Use all configured subcategories for the filter dropdown instead of only data-derived ones:

```tsx
// Line 301: Change from
const allCategories = [...new Set(handwerkers.flatMap(hw => hw.categories || []))].sort();

// To
const allCategories = Object.values(majorCategories)
  .flatMap(cat => cat.subcategories)
  .sort();
```

This ensures all categories from the SSOT config are always browsable and filterable, even before any handwerker registers for them.

