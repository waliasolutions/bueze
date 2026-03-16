

# Fix 3 Build Errors + baumpflege DB Migration

## 1. Add `EMAIL_SENDER` export to `siteConfig.ts`

**File**: `supabase/functions/_shared/siteConfig.ts`

Add: `export const EMAIL_SENDER = 'Büeze.ch <noreply@bueeze.ch>';`

This resolves both TS2305 errors in `smtp2go.ts` (line 4) and `reset-user-password/index.ts` (line 4).

## 2. Remove duplicate `reinigung_hauswartung` key in `subcategoryLabels.ts`

**File**: `supabase/functions/_shared/subcategoryLabels.ts`

Line 12 already has `'reinigung_hauswartung': 'Reinigung & Hauswartung'` as a major category. Line 107 duplicates it with value `'Hauswartung'`. Remove line 107. The major category entry on line 12 is the correct SSOT label.

## 3. Database migration: add `baumpflege` to enum

Single migration file with:

```sql
ALTER TYPE handwerker_category ADD VALUE IF NOT EXISTS 'baumpflege';
```

PostgreSQL 15 (Supabase) supports `ADD VALUE IF NOT EXISTS` inside transactions, so no special handling needed. The statement is idempotent.

## Summary

| Change | File |
|--------|------|
| Add `EMAIL_SENDER` export | `supabase/functions/_shared/siteConfig.ts` |
| Remove duplicate key (line 107) | `supabase/functions/_shared/subcategoryLabels.ts` |
| Add `baumpflege` enum value | DB migration |

