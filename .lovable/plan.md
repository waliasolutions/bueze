

# Safety Analysis of the Approved Plan

## Fix 1: emailTemplates.ts — SAFE

**What changes**: Delete the hardcoded `majorCategoryMap` (lines 616-681) and replace the grouping logic (lines 685-722) with imports from existing SSOT files.

**Risk assessment**:
- `majorCategoryMap` is only used inside `adminRegistrationNotificationTemplate` in this same file — confirmed via search, no other consumers
- `adminRegistrationNotificationTemplate` is only called by `send-admin-registration-notification/index.ts` — one caller
- The existing code is **already broken** (stale English keys like `electrician_installation` never match real DB values like `elektro_hausinstallationen`), so this fix can only improve things
- The replacement imports (`majorCategoryMapping.ts`, `categoryLabels.ts`) are already used by other edge functions (e.g., `send-lead-notification`) — proven to work in Deno runtime
- The `subcategoryLabels.ts` shared file already contains both major category keys AND subcategory keys with correct labels — confirmed lines 2-13
- Empty/undefined guard preserves existing "Keine Kategorien angegeben" fallback behavior

**SSOT**: Yes — eliminates the only remaining duplicate category mapping in the codebase. After this fix, all edge functions use `majorCategoryMapping.ts` + `categoryLabels.ts`/`subcategoryLabels.ts`.

**DRY**: Yes — removes 66 lines of stale duplicated data.

**Can it break something?**: No. The current code produces wrong output 100% of the time. The new code uses the same SSOT that `send-lead-notification` already uses successfully.

---

## Fix 2: ReceivedProposals callback — SAFE

**What changes**: Add optional `onProposalStatusChange?: () => void` prop, call it after successful accept/reject.

**Risk assessment**:
- The prop is **optional** (`?.()`) — existing callers that don't pass it are unaffected
- `ReceivedProposals` is used in `Dashboard.tsx` — only one consumer, which will pass `fetchUserData`
- The callback fires **after** `fetchProposals()` already completes (line 264, 279) — no race condition
- No new state, no new effects, no event listeners to clean up

**SSOT/DRY**: Not applicable — this is a UI wiring fix, not data duplication.

**Can it break something?**: No. Optional prop with optional chaining. Zero impact on existing behavior if not provided.

---

## Verdict: Both fixes are safe to implement

- Fix 1: Pure improvement — replaces broken code with working SSOT imports
- Fix 2: Additive-only — optional callback prop with no side effects on existing callers

No database changes. No new dependencies. No migration needed.

