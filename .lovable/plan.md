# Fix login flicker — root-cause QA

## What's actually happening

Console logs right after login (09:22:47–52) show a burst of ~10 parallel `NetworkError`s on `GET /user_roles`, each followed by:

```
[useUserRole] No roles found for user: 0556… — defaulting to user role
```

Then the cache fills and the UI re-renders with the real `admin` role. That gap is the flicker the user sees on the way to `/admin/dashboard`.

Three layered causes:

### 1. Thundering herd on `user_roles` (primary)
`useUserRole()` is instantiated independently by **Header, UserDropdown, Dashboard, ViewModeContext, AdminViewSwitcher, HandwerkerDashboard, ConversationsList, Profile, TestDashboard, useAuthGuard, …** Each instance:
- runs its own `getSession()` on mount
- runs its own `supabase.from('user_roles').select()`
- has its own `onAuthStateChange` subscription that **also** refetches on every event

Plus `AdminAuthContext` queries `user_roles` separately. On a single login, Supabase receives ~10+ concurrent identical requests over a freshly opened connection — several get throttled to `NetworkError`.

No SSOT, violating the project rule.

### 2. Silent fallback to `'user'` on transient error
`useUserRole` does:
```ts
const fetchedRoles = rolesData?.map(...) || ['user'];
setAllRoles(fetchedRoles.length > 0 ? fetchedRoles : ['user']);
```
When the fetch fails (`rolesData === null` because of NetworkError), an **admin** is briefly rendered as a plain user. Header/UserDropdown switch to client nav, `/admin/dashboard` guard considers redirecting, then the next fetch succeeds and role flips back to `admin` → visible flicker.

### 3. Refetch on non-identity auth events
`onAuthStateChange` in `useUserRole` reacts to **every** event (`INITIAL_SESSION`, `SIGNED_IN`, `TOKEN_REFRESHED`, `USER_UPDATED`). Each one clears the cache (`roleCache.delete`) and refires the fetch. A normal login emits 2–3 events back-to-back, multiplying the herd.

Secondary noise visible in the same window: `site_settings` and `billing_settings` also error with `NetworkError` / `AbortError` — same thundering-herd pattern, but they aren't the flicker driver.

## Fix (frontend only, surgical)

### A. `src/hooks/useUserRole.ts` — make it a true SSOT
1. **In-flight dedup**: add a module-level `Map<userId, Promise<AppRole[]>>`. If a fetch for the same user is already running, all subsequent hook instances await the same promise instead of issuing their own request.
2. **Don't clobber on error**: if `error` is set or `rolesData` is `null`, keep the previously known `allRoles` (and cached value if present). Only fall back to `['user']` when the query genuinely returns an empty array.
3. **Filter auth events**: only react to `SIGNED_IN` (with a *changed* user id) and `SIGNED_OUT`. Ignore `TOKEN_REFRESHED`, `USER_UPDATED`, `INITIAL_SESSION` (the initial `getSession()` already covers it). Stop calling `roleCache.delete()` on every event — only clear on `SIGNED_OUT` or actual user-id change.
4. Keep the `setTimeout(0)` deferral (project memory rule).

### B. `src/contexts/AdminAuthContext.tsx` — reuse the same source
Replace the standalone `from('user_roles')` query with `useUserRole()` so admin auth shares the deduped cache instead of issuing a parallel request.

### C. Verification
- Reload after login, watch console: expect **zero** `NetworkError` on `user_roles` and **zero** `[useUserRole] No roles found` warnings for the admin user.
- Header/UserDropdown should show "Administrator" immediately, no client→admin flip.
- `/admin/dashboard` should render without a brief redirect bounce.
- Run build/typecheck (auto by harness).

## Out of scope (mention only)
The `site_settings` / `billing_settings` `NetworkError`s show the same pattern but don't cause the role-driven flicker. Happy to fix in a follow-up if you want — flag it separately so this change stays focused.

## Files touched
- `src/hooks/useUserRole.ts` (dedup + resilient error path + event filter)
- `src/contexts/AdminAuthContext.tsx` (consume `useUserRole` instead of own query)

No DB, no RLS, no UI redesign.
