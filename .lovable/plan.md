

# Fix: Category Count Mismatch in Admin Edit Dialog

## Problem
Line 181 shows `currentCats.length` as the total count. But the major category checkboxes act as "select all" toggles — they appear checked only when ALL subcategories are selected. The count says e.g. "3 ausgewählt" but visually only 2 subcategory checkboxes are ticked, because the major category checkbox showing as checked is not counted separately (it's derived, not stored).

## Fix
The count on line 181 is actually correct in terms of data — `currentCats` contains exactly the subcategories stored in the DB. The visual confusion is that the major category checkbox shows as checked (when all subs are selected) making users think there should be +1 in the count.

**Solution**: Change the header count to show both the number of selected subcategories AND how many major categories are fully selected, making it clearer:

Replace line 181:
```typescript
<p className="text-sm font-semibold text-muted-foreground pt-2">Kategorien ({currentCats.length} ausgewählt)</p>
```
With a count that includes the visually-checked major categories:
```typescript
const checkedMajorCount = Object.values(majorCategories).filter(
  m => m.subcategories.length > 0 && m.subcategories.every(s => currentCats.includes(s))
).length;
const totalVisualChecks = currentCats.length + checkedMajorCount;
```
Then display: `Kategorien ({totalVisualChecks} ausgewählt)`

This way, if "Bau & Renovation" has all subs selected and shows a checked checkbox, it counts toward the total — matching what the admin sees visually.

## Files Changed
| File | Change |
|------|--------|
| `src/components/admin/HandwerkerEditDialog.tsx` | Add `checkedMajorCount` computation, update count display (3 lines) |

No new dependencies. Pure display fix.

