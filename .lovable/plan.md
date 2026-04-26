
# Remove IBAN from completeness scoring (SSOT + DRY)

## Goal

IBAN should no longer affect the profile completeness percentage. A handwerker with all 5 required fields + the remaining 5 optional fields (Stundensätze, Firmenname, Logo, Portfolio, UID) must reach **100%**, not 91%.

## Root cause of the current 91%

`src/lib/profileCompleteness.ts` currently scores 11 fields (5 required + 6 optional, IBAN being the 6th optional). Removing IBAN from the requirement list drops the denominator to 10, so a handwerker filling everything except IBAN scores 10/10 = **100%**.

## Existing DRY violation to fix at the same time

The exact same requirements list is currently defined twice:
- `src/lib/profileCompleteness.ts` (used for percentage + status)
- `src/components/ProfileCompletenessCard.tsx` (used for the visual checklist)

This is the reason the SSOT can drift. We will fix both by exposing the requirement list from the SSOT module and having the card consume it.

## Changes (minimal, SSOT-respecting)

### 1) `src/lib/profileCompleteness.ts` — SSOT
- **Remove** the IBAN entry from the `requirements` array.
- **Export** the computed requirements (label + completed + required) as part of the result so the card can render directly from it. New shape:
  ```ts
  ProfileCompletenessResult {
    percentage, requiredComplete, requiredTotal,
    optionalComplete, optionalTotal, isComplete, missingRequired,
    requirements: Array<{ label: string; completed: boolean; required: boolean }>
  }
  ```
- IBAN stays in `ProfileCompletenessInput` only if still referenced elsewhere; otherwise we keep the field in the type for backward compatibility but simply don't score it. (Decision: keep field in input type, drop from requirements only — minimizes blast radius.)

### 2) `src/components/ProfileCompletenessCard.tsx` — consume SSOT
- **Delete** the local `requirements` array.
- Render `result.requirements` directly, splitting by `required: true | false`.
- IBAN row disappears automatically.
- No other UI changes.

### 3) Verify the two admin consumers still work
- `src/pages/admin/HandwerkerManagement.tsx` and `src/pages/admin/HandwerkerApprovals.tsx` use only `percentage` / `isComplete` / `missingRequired` — all preserved. No edits needed.

## Acceptance

- A handwerker with everything filled except IBAN now shows **100%** on the profile card and in admin views.
- The IBAN line no longer appears under "Optional" in the completeness card.
- Only one place (`profileCompleteness.ts`) defines the requirement list — the card consumes it.
- Builds cleanly; no other consumer breaks.

## Files touched

- `src/lib/profileCompleteness.ts` — drop IBAN from requirements, expose `requirements` in result
- `src/components/ProfileCompletenessCard.tsx` — render from `result.requirements` instead of local copy

## Notes

- IBAN data itself remains stored in `handwerker_profiles.iban` and is still editable in the profile form — only the completeness scoring stops counting it.
- No DB migration needed.
