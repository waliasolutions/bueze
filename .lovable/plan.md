

# Plan: QA Remediation — SSOT, DRY, Code Bloat Fixes

## Overview

Four targeted fixes from the audit, prioritized by severity. Finding 1 (Deno/Node sync test) is deferred to the existing Phase 3 remediation plan to avoid duplication.

---

## Fix 1: Remove `reinigung_hauswartung` self-reference (High — Data Integrity)

**Pre-check**: Query existing handwerker profiles in DB to see if any have `reinigung_hauswartung` stored in their `categories` array. If they do, the matching logic already handles major category IDs directly (both `checkCategoryMatch` in frontend and `handwerkerMatchesCategory` in backend check if a handwerker's category IS a major category ID). So removing the self-reference from the subcategory list is safe — those handwerkers will still match via the major-category-direct path.

**Files changed**:

| File | Change |
|------|--------|
| `src/config/majorCategories.ts` | Remove `'reinigung_hauswartung'` from `reinigung_hauswartung.subcategories`, leaving `['reinigung']` |
| `supabase/functions/_shared/majorCategoryMapping.ts` | Same removal in the `reinigung_hauswartung` entry |

---

## Fix 2: Use shared `validatePassword()` in HandwerkerOnboarding (Low — DRY)

**Current** (lines 330-334): Inline reimplementation of password checks.

**Change**: Import and use `validatePassword` from `@/lib/validationHelpers.ts`.

```tsx
import { validatePassword } from '@/lib/validationHelpers';

// Replace lines 330-334 with:
const pwResult = validatePassword(formData.password);
if (!pwResult.valid) {
  newErrors.password = pwResult.error!;
}
```

The existing `PASSWORD_MIN_LENGTH` import can be removed if no longer used elsewhere in the file.

**File**: `src/pages/HandwerkerOnboarding.tsx`

---

## Fix 3: Remove unused `userId` param from `getLeadAnalytics` (Low — Code Bloat)

`userId` is accepted but never used — RLS handles access scoping.

**Files changed**:

| File | Change |
|------|--------|
| `src/lib/leadHelpers.ts` | Change signature from `(leadId: string, userId: string)` to `(leadId: string)` |
| `src/pages/LeadDetails.tsx` | Update call from `getLeadAnalytics(lead.id, user.id)` to `getLeadAnalytics(lead.id)` |

---

## Fix 4: Finding 1 — Deno/Node Sync (Deferred)

Already covered in the Phase 3 remediation plan. No action here to avoid duplication.

---

## Summary

| # | Fix | Files | Effort |
|---|-----|-------|--------|
| 1 | Remove `reinigung_hauswartung` self-reference | `majorCategories.ts`, `majorCategoryMapping.ts` | 2 min |
| 2 | Use shared `validatePassword()` | `HandwerkerOnboarding.tsx` | 3 min |
| 3 | Remove unused `userId` param | `leadHelpers.ts`, `LeadDetails.tsx` | 2 min |
| 4 | Deno/Node sync test | Deferred to Phase 3 | — |

