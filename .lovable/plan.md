## Rechtsform doubling — recommendation

On the Zefix side the **legal name always contains the Rechtsform** (e.g. "Muster Bau GmbH"), and the Rechtsform is a separate structured column we need for filtering, invoicing and legal display. So the "double" appearance is expected — it mirrors the Handelsregister itself and matches how the Impressum / admin lists already read the two fields independently. Recommendation: **leave the company name untouched, keep Rechtsform as its own field**. Stripping the suffix from the name would diverge from the official HR entry and break downstream displays that assume the full legal name. No change required here unless you want a purely cosmetic tweak.

## Smoother Zefix UX — plan

### 1. In-memory cache for Zefix lookups (SSOT: `src/lib/zefix.ts`)
- Add a small module-level `Map` cache with a TTL (e.g. 10 min):
  - `searchCache` keyed by normalized query
  - `detailCache` keyed by 9-digit UID
- `searchZefixCompanies` and `getZefixCompany` return from cache synchronously when fresh, otherwise fetch and populate.
- Preseed `detailCache` with any full record returned by search or `apply()` so selecting a hit that already carries an address never fires a second request.
- No changes to the edge function or DB.

### 2. Stronger UID formatting & display safety
- Extend `src/lib/validationHelpers.ts`:
  - Add `formatUidForDisplay(value)` — returns the canonical `CHE-123.456.789` when 9 digits are present, otherwise returns the raw trimmed value (never `null`, never crashes on partial input).
- Route every UID render through it. Concrete sites to update (read-only surfaces):
  - `src/pages/HandwerkerOnboarding.tsx` review step (line ~1101)
  - `src/components/ProfilePreview.tsx`
  - `src/pages/HandwerkerProfileEdit.tsx` (display cell)
  - `src/pages/admin/HandwerkerApprovals.tsx`, `HandwerkerManagement.tsx`, `admin/HandwerkerEditDialog.tsx`
  - `src/components/VerifiedSwissBadge.tsx`
- The input field keeps `normalizeUid` on write (already SSOT).

### 3. Loading skeleton + input gating during Zefix fetch
- In `ZefixCompanyNameInput`: expose an `isBusy` state upward via a new optional `onBusyChange?: (busy: boolean) => void` prop **or** a shared `useZefixBusy` context — pick the prop, it's the simplest and matches existing patterns.
- In `HandwerkerOnboarding.tsx` (and the two edit dialogs that use the same component):
  - Track `zefixBusy` local state.
  - While busy: disable the **Rechtsform Select** and **UID Input**, and swap their contents for a `Skeleton` (shadcn). Company name field stays interactive (that's where the user types).
  - Guarantees the user cannot fight the auto-fill mid-flight, and eliminates the visible "value appears, then re-appears" flicker.

### 4. Inline error + retry on Zefix failure
- `ZefixCompanyNameInput` already surfaces `error`. Upgrade the empty-state row to render:
  - Error text (`text-destructive`) with a clear message ("Handelsregister nicht erreichbar")
  - A **"Erneut versuchen"** button that re-invokes `runSearch(value, { manual: true })` — same code path as the existing manual link, just presented as a button when in error state.
- Distinguish transient network errors from "no result" (already handled) so we never show "Kein Treffer" on a failure.

### 5. QA
- Manual: type "Swisscom" → select → confirm no second spinner, Rechtsform+UID skeleton briefly appears, values fill once, no flicker.
- Manual: block network, type a query → error line + Erneut-versuchen button, click → recovers.
- Manual: search same term twice within 10 min → second call is instant (cache hit, no spinner).
- Existing `src/lib/zefix.test.ts` continues to pass; add a small cache-hit test.

### Files touched
- `src/lib/zefix.ts` (cache)
- `src/lib/validationHelpers.ts` (`formatUidForDisplay`)
- `src/components/ZefixCompanyNameInput.tsx` (busy hoist, retry button)
- `src/pages/HandwerkerOnboarding.tsx`, `src/pages/HandwerkerProfileEdit.tsx`, `src/components/admin/HandwerkerEditDialog.tsx` (skeleton + disable while busy)
- Read-only UID display sites listed above (formatter swap)
- `src/lib/zefix.test.ts` (cache test)

No DB, no edge function, no design-token changes.