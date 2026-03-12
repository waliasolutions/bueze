

# Plan: Add "Gerüstbauer" Subcategory + Admin Category Editing

## Part 1: Add "geruestbauer" to all SSOT files

The enum key will be `geruestbauer` under `bau_renovation`. Six files need updating — all are SSOT sources that the rest of the app derives from.

### 1.1 Database Migration
```sql
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'geruestbauer';
```
This makes the value valid in the `categories` column on `handwerker_profiles` and `leads`.

### 1.2 Frontend Config (2 files)

**`src/config/subcategoryLabels.ts`** — add entry after `spengler`:
```typescript
geruestbauer: {
  value: 'geruestbauer',
  label: 'Gerüstbauer',
  slug: 'geruestbauer',
  shortDescription: 'Gerüstbau und -vermietung',
  majorCategoryId: 'bau_renovation',
  keywords: ['Gerüst', 'Gerüstbau', 'Baugerüst', 'Fassadengerüst']
},
```

**`src/config/majorCategories.ts`** — add `'geruestbauer'` to `bau_renovation.subcategories` array (line 42, before closing bracket).

### 1.3 Backend Config (2 files)

**`supabase/functions/_shared/subcategoryLabels.ts`** — add:
```typescript
'geruestbauer': 'Gerüstbauer',
```

**`supabase/functions/_shared/majorCategoryMapping.ts`** — add `'geruestbauer'` to the `bau_renovation` array.

### Why this is sufficient
All other consumers (forms, directory, filters, emails, lead matching, category landing pages) already read from these SSOT files via `getCategoryLabel()`, `majorCategorySubcategories`, and `subcategoryLabels`. No additional touchpoints needed — the new value will automatically appear in:
- Client lead submission form (SubmitLead)
- Handwerker onboarding & profile edit
- Handwerker directory filters
- Admin notification emails (via the SSOT fix already done)
- Lead matching logic
- Category landing pages

---

## Part 2: Admin Category Editing in HandwerkerEditDialog

Currently the dialog only edits contact + address. Add a categories section.

### Changes to `HandwerkerEditDialog.tsx`:

1. **Extend `HandwerkerEditData` interface** — add `categories: string[]`
2. **Import** `majorCategories` from config and `subcategoryLabels` from config
3. **Add categories section** to the form UI (after address, before footer):
   - Group checkboxes by major category using `majorCategories`
   - Each major category as a collapsible header
   - Subcategories as checkboxes underneath
   - Toggle-all per major category
4. **Include `categories` in the `handleSave` update call**
5. **Add `updateCategories` helper** that sets the categories array on the form state

### Changes to `HandwerkerManagement.tsx`:

- The `Handwerker` interface already has `categories: string[]`
- The `setEditingHandwerker(h)` already passes the full handwerker object including categories
- The `HandwerkerEditData` type just needs to accept `categories` — no changes needed in the parent

### UI Approach
Use a compact multi-select with checkboxes grouped by major category. Each major category header shows a label and a "select all" toggle. Subcategories are listed as checkboxes below. This mirrors the existing pattern in `HandwerkerOnboarding` and `HandwerkerProfileEdit` but in a dialog context.

---

## Files Changed Summary

| File | Change |
|------|--------|
| DB migration | `ALTER TYPE handwerker_category ADD VALUE 'geruestbauer'` |
| `src/config/subcategoryLabels.ts` | Add `geruestbauer` entry |
| `src/config/majorCategories.ts` | Add to `bau_renovation.subcategories` |
| `supabase/functions/_shared/subcategoryLabels.ts` | Add `'geruestbauer': 'Gerüstbauer'` |
| `supabase/functions/_shared/majorCategoryMapping.ts` | Add to `bau_renovation` array |
| `src/components/admin/HandwerkerEditDialog.tsx` | Add categories to interface, form UI, and save logic |

No new files. No new dependencies. Pure additive changes.

