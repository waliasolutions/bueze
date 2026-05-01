## Plan: Let admin set a custom password (SSOT, DRY)

### Current state (already in place — reuse, don't rebuild)

- **Backend SSOT**: `supabase/functions/reset-user-password` already accepts `customPassword` in `single-custom` mode. It validates length (`PASSWORD_MIN_LENGTH = 8`), updates `auth.users` via `admin.updateUserById`, and **verifies** the change with a real `signInWithPassword` round-trip. No changes needed.
- **Admin gate**: same edge function already checks `user_roles` for `admin` / `super_admin`.
- **Validation SSOT**: `validatePassword()` in `src/lib/validationHelpers.ts` already enforces min 8 chars + letter + number. Reuse it.
- **Existing UI**: `src/pages/admin/UserManagement.tsx` already has a "Passwort zurücksetzen" dialog and `handleResetPasswordConfirm` that calls the edge function. Today it hardcodes `SUPPORT_PASSWORD`.

### What changes (one file only)

**`src/pages/admin/UserManagement.tsx`** — extend the existing reset dialog so the admin can choose between two modes (single source of UI, single edge-function call):

1. Add a small mode toggle inside the existing `AlertDialog`:
   - **«Support-Passwort verwenden»** (default — current behavior, hands the fixed `SUPPORT_PASSWORD` over)
   - **«Eigenes Passwort festlegen»** — reveals an `<Input type="password">` + confirmation field
2. When "custom" is chosen, run `validatePassword()` from `validationHelpers.ts` on submit; show the existing toast on error. No duplicated rules.
3. On confirm, call the **same** `supabase.functions.invoke('reset-user-password', { body: { userId, userEmail, userName, customPassword, notifyUsers: false } })`. The only thing that differs between the two modes is which string goes into `customPassword`.
4. After success, reuse the existing "show + copy" panel (`generatedPassword`, `handleCopyPassword`, eye-toggle) so admin can hand the password to the user.

### What we explicitly do NOT do

- ❌ No new edge function — `reset-user-password` already covers this exact use case.
- ❌ No new constant, no second password validator, no parallel dialog.
- ❌ No DB migration — `auth.users` is mutated through the admin API only.
- ❌ No change to `supabase/config.toml` — function is already registered with `verify_jwt = true`.

### Security notes (already enforced by the existing function — listed for clarity)

- Admin role check on the server.
- Min length validated server-side too.
- The chosen password is sanitized out of any log/error response (`sanitize()` helper).
- Real `signInWithPassword` verification before returning success → no silent failures.
- No email is sent in custom-password mode (`notifyUsers: false`) — admin communicates it out-of-band, same as today.

### Acceptance criteria

- Admin opens any user row → "Passwort zurücksetzen" → can pick "Eigenes Passwort", type e.g. `Bueze2026!`, confirm → user can immediately log in with that password.
- Choosing the default option keeps today's behaviour byte-for-byte.
- Invalid passwords (too short, no number, etc.) are rejected client-side via `validatePassword()` with the exact same German message used elsewhere.
