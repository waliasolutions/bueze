

# Plan: Include Major Categories in Database Save (Revised)

## Problem
Same as before — major categories not saved to DB when no subcategories selected.

## Fix

**File**: `src/pages/HandwerkerOnboarding.tsx`, around line ~560

Before the DB insert, compute the merged array once:

```tsx
const allCategories = [...new Set([...selectedMajorCategories, ...(formData.categories || [])])];
```

Then use it in the insert:

```tsx
categories: allCategories as any,
```

- Single computation, no repetition
- `new Set` deduplicates in case a major ID appears in both arrays
- Empty array is a valid value — no length check needed

## Files Changed
| File | Change |
|------|--------|
| `src/pages/HandwerkerOnboarding.tsx` | Add `allCategories` merge with dedup before save, use in insert |

