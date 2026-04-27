# Add UID-Nummer to admin handwerker edit form + consolidate UID normalization

Single PR. Feature + the necessary refactor to keep SSOT honest.

## Current state of UID handling (audited)

| Location | Validation | Normalization | Writes to |
|---|---|---|---|
| `HandwerkerProfileEdit.tsx` (self-edit) | none, placeholder only | `uidNumber.trim() \|\| null` | `handwerker_profiles.uid_number` |
| `create-handwerker-self-registration` (edge fn) | none | `data.uidNumber?.trim() \|\| null` | same |
| `HandwerkerApprovals.tsx` (admin approval) | none | none — raw value | same (via `.update(editFormData)`) |
| `HandwerkerEditDialog.tsx` (admin inline edit) | **field missing** | — | same |

Baseline: no format validation anywhere, only whitespace trim (and approvals doesn't even trim). All four paths target the same column → one normalizer must own all four writes.

## Changes

### 1. New util — `src/lib/validationHelpers.ts`
```ts
/**
 * Normalize Swiss UID input: trim, uppercase the CHE prefix
 * (tolerating any whitespace between CHE and digits), null when empty.
 * SSOT for every uid_number write.
 */
export function normalizeUid(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.replace(/^che[-\s]*/i, 'CHE-');
}
```
Format validation is intentionally NOT added; if added later it lives here only.

### 2. New util — `supabase/functions/_shared/validation.ts`
Identical implementation, Deno-side. The `_shared/` pattern is already established (see `_shared/errorUtils.ts`, `profileHelpers.ts`, etc.). No TODO fallback.
Deno import note for the implementer: use the relative path **with `.ts` extension** — `import { normalizeUid } from '../_shared/validation.ts'`. Deno is strict about this, Vite isn't.

### 3. `src/components/admin/HandwerkerEditDialog.tsx` — the actual feature
- Add `uid_number: string | null` to `HandwerkerEditData`.
- Render a UID input below "Firma" with the existing `Input` + `Label` + `updateField` pattern. Placeholder `CHE-123.456.789`.
- In `handleSave`, write `uid_number: normalizeUid(activeForm.uid_number)`.

### 4. Migrate all four write sites to `normalizeUid`
- `src/pages/HandwerkerProfileEdit.tsx` line 670 → `uid_number: normalizeUid(uidNumber),`
- `src/pages/admin/HandwerkerApprovals.tsx` `saveHandwerkerEdit` (~line 614): build `const payload = { ...editFormData, uid_number: normalizeUid(editFormData.uid_number ?? null) };` then `.update(payload as any)`. The `as any` stays — `editFormData` is `Partial<PendingHandwerker>` whose `categories: string[]` doesn't match the Postgres `handwerker_category[]` enum type, so the cast is structural, not a smell to fix here.
- `supabase/functions/create-handwerker-self-registration/index.ts` line 150 → import from `../_shared/validation.ts`, use `uid_number: normalizeUid(data.uidNumber),`.
- `HandwerkerEditDialog.tsx` already covered in step 3.

## What is NOT changed
- DB schema — `uid_number` already nullable, no constraint.
- Profile completeness logic — already counts `uid_number`.
- UI of the other three forms — only the save handlers gain the normalizer call.
- The `as any` cast in approvals — out of scope, structurally justified.

## SSOT / DRY check
- One UI surface for inline admin UID edit (the dialog).
- One normalizer per runtime (Vite + Deno) — minimum physically possible split.
- Zero remaining duplicated `?.trim() || null` UID lines after this PR.
- No follow-up ticket.

## Validation
**Prereq:** the edge function `create-handwerker-self-registration` will be auto-deployed by Lovable on save. Step 4 is only meaningful after that deploy completes — wait for the green deploy indicator, or check Edge Function logs, before running it.

1. `/admin/handwerkers` → Bearbeiten on Mihr Haile → enter `che   123.456.789` (multiple spaces, lowercase) → Save → DB shows `CHE-123.456.789`. Completeness: 90% → 100%.
2. Self-edit on a handwerker profile → enter same garbled input → same normalized result.
3. `/admin/handwerker-approvals` → edit a pending registration's UID with garbled input → Save → same normalized result.
4. Fresh handwerker registration via the public form with garbled UID → DB row stored normalized (edge function path; requires the new edge function deploy to be live).
