
# Make login possible with password `A12345678`

## Goal

Allow the affected user to log in with the fixed password `A12345678` without introducing a second auth system, and harden the onboarding flow so this edge case is handled cleanly in future.

## What to build

### 1) Reuse the existing password-reset Edge Function for fixed-password support
The backend already supports this:

- `supabase/functions/reset-user-password/index.ts`
- It accepts `customPassword`
- In single-custom mode it resets and verifies the password without emailing it automatically

No new auth logic is needed. The implementation should reuse this existing SSOT path.

### 2) Add an admin UI action for “Set password to A12345678”
Use the existing admin password-reset pattern from `src/pages/admin/UserManagement.tsx` and expose the same capability where support/admin can use it for a specific user.

Recommended implementation:
- Add a targeted action in `src/pages/admin/UserManagement.tsx`
- Or add the same action in `src/pages/admin/HandwerkerManagement.tsx` for handwerker support cases
- Invoke `reset-user-password` with:
  - `userId`
  - `userEmail`
  - `userName`
  - `customPassword: 'A12345678'`
  - `notifyUsers: false`

UI behavior:
- Confirm dialog before resetting
- Success toast saying the password was set to `A12345678`
- Optional copy button for the password
- Clear destructive error if verification fails

### 3) Make incomplete handwerker registrations recoverable
The affected edge case is caused by Step 1 creating the auth user before Steps 2/3 finish.

In `src/pages/HandwerkerOnboarding.tsx`:
- Keep the current resume-aware behavior
- Remove the aggressive draft-clearing on mount:
  - `localStorage.removeItem('handwerker-onboarding-draft')`
  - `sessionStorage.removeItem('pending-recovery-data')`
- When `already registered` occurs, keep showing the inline login recovery card
- Improve the recovery copy to explicitly say:
  - account was already started
  - user can log in and continue
  - if they do not know the password, they should reset it

This keeps the current architecture and improves recovery instead of creating parallel flows.

### 4) Make reset guidance more prominent
In:
- `src/pages/HandwerkerOnboarding.tsx`
- `src/pages/Auth.tsx`

Improve the messaging after login failure / duplicate email:
- “Registrierung bereits begonnen”
- “Bitte melden Sie sich an, um fortzufahren”
- “Falls Sie Ihr Passwort nicht kennen, nutzen Sie «Passwort vergessen?»”

This reduces support friction for users who lose the initial session.

## Why this approach

- Reuses the existing `reset-user-password` function as SSOT
- Avoids hardcoding a universal bypass in normal login logic
- Keeps security intact: password still lives in Supabase Auth, not in frontend code
- Fixes both the immediate support need and the future edge case

## Files to change

1. `src/pages/admin/UserManagement.tsx`
   - Add support for fixed custom-password reset using `A12345678`

2. `src/pages/admin/HandwerkerManagement.tsx`
   - Optional: add the same support action for handwerker-specific admin workflows

3. `src/pages/HandwerkerOnboarding.tsx`
   - Stop clearing recovery draft state on mount
   - Strengthen duplicate-account recovery UI
   - Keep resume path for existing auth user without `handwerker_profiles`

4. `src/pages/Auth.tsx`
   - Improve reset guidance after failed login / recovery situations

## Technical details

```text
Existing backend support already present:
reset-user-password(userId, userEmail, userName, customPassword)

Needed frontend behavior:
Admin clicks support action
→ invoke existing edge function with customPassword: 'A12345678'
→ function updates password
→ function verifies sign-in
→ admin can tell user to log in with A12345678
```

## Acceptance criteria

- Admin can set a selected user’s password to `A12345678` from the UI
- The affected user can log in with that password
- No new auth bypass or duplicate reset flow is introduced
- Interrupted onboarding no longer traps users in “already registered but cannot proceed”
- Recovery UX clearly points users to login or password reset

## Notes

- No database migration is required
- No changes to `auth.users` schema or RLS are needed
- This should stay a support/admin action, not a public “master password” behavior
