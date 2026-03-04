

# Refined Plan: Checkout Streamlining, Cache Leak Fix, Test Mode Clarity

## 1. Cross-Account Cache Leak Fix (App.tsx)

**Approach:** Instead of a separate component, add an `onAuthStateChange` listener directly inside the existing `App` component (where `queryClient` is already in scope). This keeps architecture flat per your suggestion.

**On `SIGNED_OUT`:**
- `queryClient.clear()` — wipe all React Query cache
- `roleCache.clear()` (from `useUserRole.ts`) — already happens there, but double-ensuring
- `sessionStorage.clear()` — already done in `UserDropdown.handleSignOut`, but this catches programmatic sign-outs and browser-level session expiry too

**On `SIGNED_IN`:**
- `queryClient.clear()` — ensures fresh data for the new user (fail-safe)

This is ~15 lines added to the existing `useEffect` in `App`.

**Security note:** `localStorage` items like cookie consent and onboarding drafts are non-sensitive and user-agnostic, so they don't need clearing. The sensitive items (role cache, query cache, session storage view mode) are all covered.

## 2. Checkout Streamlining (Checkout.tsx)

**"Summary-First" pattern** for the approved checkout view (lines 314-570):

- **When plan is pre-selected via URL param:** Replace the full RadioGroup card with a compact "receipt item" banner:
  ```
  ┌─────────────────────────────────────────┐
  │  ✓ Monthly Pro Plan      CHF 49/Monat   │
  │    Enthält 15 Offerten · Priorität       │
  │                        [Plan ändern ▾]   │
  └─────────────────────────────────────────┘
  ```
- **"Plan ändern" link:** Opens a `Collapsible` accordion (already available via Radix) that reveals the existing RadioGroup options. The payment button stays visible below.
- **Remove numbered steps:** No "1." / "2." — single flow. Payment methods info merges into the order summary sidebar instead of a separate card.
- **Payment button stays in the sticky sidebar** (already there), so it's always accessible.

**Key behavior:**
- `planFromUrl` boolean tracks if plan came from URL params
- If `planFromUrl` is true → show collapsed summary
- If user clicks "Plan ändern" → expand RadioGroup via Collapsible
- If no URL param → show full RadioGroup (direct `/checkout` navigation)

## 3. Test Mode Toast Clarity (Checkout.tsx)

Add a visible `Alert` banner at the top of the checkout page when the response includes `testMode: true`. Currently the toast fires and disappears. Instead:

- Keep the existing toast for immediate feedback
- After redirect to success page, the success page should show a subtle "Testmodus" badge (this is already handled by the `?success=true` param flow)
- No additional change needed beyond what's already in place — the toast at line 158-161 already provides clarity

**Optional enhancement:** Add a console.info in the edge function response handler so QA testers can see it in DevTools. Minimal code, high clarity.

## Files Changed

1. **`src/App.tsx`** — Add auth state listener for `queryClient.clear()` + `sessionStorage.clear()` on sign-out/sign-in
2. **`src/pages/Checkout.tsx`** — Redesign approved checkout: summary-first pattern with collapsible plan selector, remove numbered steps, merge payment info into sidebar

No edge function changes. No new files.

