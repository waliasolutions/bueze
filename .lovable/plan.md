

# Fix: Handwerker In-App Subscription Purchase + Payrexx Test Mode Handling

## Two Issues Identified

### Issue 1: Handwerker subscription upgrade only redirects to `/checkout`
The `SubscriptionManagement` component on `/profile?tab=subscription` already shows upgrade cards with "Jetzt upgraden" buttons. These call `onUpgradePlan` which navigates to `/checkout?plan={planId}`. The checkout page then calls `create-payrexx-gateway`. **This flow already exists and is correct.** The "Abo verwalten" nav link added in the last change points to `/profile?tab=subscription` — so the handwerker CAN access it.

However, if a handwerker has NO subscription record yet (no row in `handwerker_subscriptions`), `currentSubscription` is `null`, and the SubscriptionManagement component shows the "Abonnement wählen" view with plan cards — which also calls `onUpgradePlan`. This part works.

The real problem is likely that the Payrexx API call fails silently or returns an error.

### Issue 2: Payrexx test API returns error, no dummy confirmation
Looking at the edge function logs, there are no gateway creation log entries (only boot/shutdown). The Payrexx API call either:
- Fails with a non-JSON response (HTML error page from test instance)
- Returns an error status that gets swallowed

The `create-payrexx-gateway` function doesn't handle non-JSON responses defensively. With test API keys on the `wsolutions` instance, the Payrexx API may reject gateway creation or return unexpected formats.

**Fix**: Add defensive response parsing in the edge function AND a test-mode fallback. When Payrexx returns an error in test mode, return a simulated gateway URL that redirects to the success URL with a test confirmation, so the flow can be tested end-to-end.

## Plan

### 1. Fix `create-payrexx-gateway` edge function
- Add defensive `Content-Type` check before parsing JSON
- Log the full response for debugging
- Add a `PAYREXX_TEST_MODE` secret check: if test mode and Payrexx fails, return the `successUrl` directly as a fallback so the handwerker sees a confirmation flow

### 2. Improve error display in Checkout.tsx
- Show the actual Payrexx error message in the toast instead of generic text
- The `supabase.functions.invoke` error object may contain the edge function's error response — extract and display it

### 3. No navigation changes needed
The `/profile?tab=subscription` route + the "Abo verwalten" nav item already provide in-app access. The SubscriptionManagement component already shows upgrade options. The checkout page handles approved handwerkers correctly.

## Files Modified

| File | Change |
|------|--------|
| `supabase/functions/create-payrexx-gateway/index.ts` | Defensive response parsing, detailed logging, test-mode fallback |
| `src/pages/Checkout.tsx` | Better error message extraction from edge function response |

