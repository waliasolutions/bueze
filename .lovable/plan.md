

# Fix: Category Count Includes Non-Visible Major Category Keys

## Problem
Some handwerkers have **major category keys** (e.g., `'bau_renovation'`) stored directly in their `categories` array alongside subcategories. The current count uses `currentCats.length` which includes these major keys, but the UI only renders checkboxes for subcategories — causing a mismatch (e.g., "3 ausgewählt" but only 2 checkboxes are ticked).

## Root Cause
The `CategorySelector` component in multi mode stores both major category IDs and subcategory IDs in the selection array. Old data or the onboarding flow may have saved major keys to the DB. The admin dialog's count doesn't filter these out.

## Fix (1 file)

**`src/components/admin/HandwerkerEditDialog.tsx`**

1. Build a `Set` of all known subcategory IDs from `majorCategories`
2. Filter `currentCats` to only count entries that are actual subcategories
3. Use the filtered count for the display

```typescript
// Collect all valid subcategory IDs
const allSubcatIds = new Set(
  Object.values(majorCategories).flatMap(m => m.subcategories)
);
// Only count subcategories that have visible checkboxes
const visibleSubcatCount = currentCats.filter(c => allSubcatIds.has(c)).length;
const totalVisualChecks = visibleSubcatCount + checkedMajorCount;
```

This ensures the count matches exactly what the admin sees — subcategory checkboxes plus fully-checked major category headers. Major category keys stored in the DB but not rendered as checkboxes are excluded from the count.

No new files. No new dependencies. Single computation change.

