

# Dynamic Filters in Handwerkerverzeichnis — Updated Plan

## Approach

- **Memoization**: Wrap `availableCantons` and `availableCategories` in `useMemo` keyed on `handwerkers` to avoid recalculation on unrelated re-renders.
- **Global filtering**: Derive available sets from the full `handwerkers` array (not from already-filtered results). This ensures all existing cantons/categories remain visible regardless of other active filters.

## Changes

**File: `src/pages/HandwerkerVerzeichnis.tsx`**

1. Add `useMemo` import
2. In `HandwerkerVerzeichnis` component, compute:
   ```ts
   const availableCantons = useMemo(() =>
     new Set(handwerkers.map(hw => hw.business_canton).filter(Boolean)),
   [handwerkers]);

   const availableCategories = useMemo(() =>
     new Set(handwerkers.flatMap(hw => hw.categories || [])),
   [handwerkers]);
   ```
3. Pass both sets to `BrowseLayer`
4. In `BrowseLayer`: filter canton chips to `availableCantons.has(canton.value)`, filter major category groups and subcategories to only those present in `availableCategories`, hide empty groups entirely
5. No changes to `ResultsLayer` — its category dropdown already derives from data

Single file, no new dependencies.

