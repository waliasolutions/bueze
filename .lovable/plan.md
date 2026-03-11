

# Plan: Fix Email Category SSOT + Dashboard Stale Data

## Fix 1: Replace stale `majorCategoryMap` in emailTemplates.ts

**File**: `supabase/functions/_shared/emailTemplates.ts`

1. **Add imports** at top of file:
   ```typescript
   import { majorCategorySubcategories, getMajorCategoryForSubcategory } from './majorCategoryMapping.ts';
   import { getCategoryLabel } from './categoryLabels.ts';
   ```

2. **Delete** the entire `majorCategoryMap` constant (lines 616-681).

3. **Rewrite** the grouping logic (lines 685-722) with early return for empty/undefined:
   ```typescript
   // Early return for empty/undefined categories
   let categoriesText = '';
   if (!data.categories || data.categories.length === 0) {
     categoriesText = 'Keine Kategorien angegeben';
   } else {
     const categoryGroups = new Map<string, string[]>();
     
     for (const cat of data.categories) {
       // If cat is itself a major category key
       if (majorCategorySubcategories[cat]) {
         if (!categoryGroups.has(cat)) categoryGroups.set(cat, []);
         continue;
       }
       // Find parent major category
       const major = getMajorCategoryForSubcategory(cat);
       if (major) {
         if (!categoryGroups.has(major)) categoryGroups.set(major, []);
         categoryGroups.get(major)!.push(getCategoryLabel(cat));
       } else {
         // Standalone subcategory with no known parent
         categoriesText += `${getCategoryLabel(cat)}<br>`;
       }
     }
     
     if (categoryGroups.size > 0) {
       const formatted = Array.from(categoryGroups.entries()).map(([majorKey, subs]) => {
         const majorLabel = getCategoryLabel(majorKey);
         return subs.length > 0
           ? `<strong>${majorLabel}</strong> (${subs.join(', ')})`
           : `<strong>${majorLabel}</strong>`;
       });
       categoriesText = formatted.join('<br>') + (categoriesText ? '<br>' + categoriesText : '');
     }
     
     if (!categoriesText) categoriesText = 'Keine Kategorien angegeben';
   }
   ```

   This preserves the existing fallback text for empty arrays, undefined values, AND the edge case where all categories are unrecognized (final guard).

---

## Fix 2: Refresh Dashboard after proposal accept/reject

**File**: `src/components/ReceivedProposals.tsx`
- Add `onProposalStatusChange?: () => void` to props interface
- Call `onProposalStatusChange?.()` after success in `handleAccept`, `handleReject`, and batch handler

**File**: `src/pages/Dashboard.tsx`
- Pass `onProposalStatusChange={fetchUserData}` to `<ReceivedProposals>`

Full refresh is correct here since accept/reject changes lead status AND counters.

---

## Files changed

| File | Change |
|------|--------|
| `supabase/functions/_shared/emailTemplates.ts` | Delete `majorCategoryMap`, add 2 imports, rewrite grouping with SSOT + empty guard |
| `src/components/ReceivedProposals.tsx` | Add optional callback prop, 3 one-line calls |
| `src/pages/Dashboard.tsx` | Add one prop to ReceivedProposals |

