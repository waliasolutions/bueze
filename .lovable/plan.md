

# Diagnosis: Renato Testa registration

## What happened
1. **08:57:34** — Renato completed Step 1 (Kontakt & Firma): `auth.signUp()` succeeded → auth user `bca01510…` created, `profiles` row auto-created via `handle_new_user()` trigger with default role `'user'`.
2. **08:57:55** — Session was logged out (likely because `info@bueeze.ch` admin logged in on the same browser, replacing the session).
3. **08:59:23** — Someone tried to sign up Renato again from `/handwerker-dashboard` → **422 "User already registered"**.
4. **Result:** Auth user + profile exist, but **no `handwerker_profiles` row**, role is `'user'` not `'handwerker'`. He shows up as a regular client, not in handwerker management. Step 3 (`handleSubmit` → insert into `handwerker_profiles`) was never reached.

## Two root causes
1. **Onboarding flow is fragile when session changes mid-flow.** Step 1 creates the auth user immediately. If the session is lost between Step 1 and Step 3, the user is stuck — re-signup fails with 422 and there's no recovery path. The handwerker profile is never created.
2. **Session collision:** Logging in as another user (admin in another tab) replaces the Supabase session in `localStorage`, killing the in-progress onboarding silently.

## Fix plan

### A. Recover Renato now (data fix)
- Promote `bca01510-20d5-462b-a392-40342572217d` from role `'user'` → `'handwerker'`.
- Create a minimal `handwerker_profiles` row (status `pending`) so admin can see/edit him in Handwerker Management. He can then complete his profile via "Profil bearbeiten" after login. Use his existing data: name "Renato Testa", email `renato.testa@mlg-ag.ch`, phone `+41 31 330 20 70`, company `MLG AG` (inferred from email — confirm with user before creating).
- Delete the stale duplicate user `98bcd35f…` (`info@mlg-ag.ch`, also "Renato Testa", same problem from earlier today) **only after confirming with user** it's not real.

### B. Make the onboarding resilient (prevent recurrence)
1. **Resume-aware Step 1:** When `currentContent === 'contact'` and the user already has a session matching the entered email, skip `signUp()` entirely and jump straight to Step 2. This handles "I came back after losing session."
2. **Recover from "already registered":** When 422 occurs, the inline login form already appears — but after successful login, also check if a `handwerker_profiles` row exists. If not, jump to Step 2 instead of routing to `/handwerker-dashboard`. This rescues anyone stuck in the same partial state.
3. **Detect session loss between steps:** On Step 2/3, if `getUser()` returns null or a different user than the one who created the account, show a clear "Sitzung verloren — bitte erneut anmelden" message with the inline login form, instead of the current generic "Nicht angemeldet" error.
4. **Persist onboarding intent in localStorage:** The draft already exists; extend it with `pendingHandwerkerEmail` so on remount we can detect "this user started handwerker registration but never finished" and resume them at Step 2.

### C. Open question for the user
Before executing the data fix for Renato, I need to confirm:
- Is `MLG AG` his company? (inferring from `mlg-ag.ch` domain)
- Should I delete the older orphan user `98bcd35f…` (`info@mlg-ag.ch`, created 08:41 today, same problem)?

## Files
- `src/pages/HandwerkerOnboarding.tsx` — resume logic, session-loss detection, post-login routing
- 1 data migration to fix Renato + (optionally) clean up the duplicate

**Files changed: 1 · Data fix: 1 migration**

