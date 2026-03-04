

# Updated Implementation Plan — Codebase Audit Fixes

Incorporates user feedback: protect Handwerker workflows when syncing LeadStatus, and use `getUserByEmail()` for the self-registration fix.

---

## Phase 1: Security Fixes (P0)

### 1.1 Fix DNS prefetch domain in `index.html`
Replace `xngvicfjbmjhipanpupp.supabase.co` with `ztthhdlhuhtwaaennfia.supabase.co`.

### 1.2 Add security headers to `vercel.json`
Add `Strict-Transport-Security` and `Content-Security-Policy` headers.

### 1.3 Add auth checks to vulnerable edge functions
- `create-handwerker-account` — add admin role check via `getClaims()`
- `cleanup-orphaned-records` — add admin role check via `getClaims()`

### 1.4 Fix `listUsers()` DoS vector in self-registration
**Updated per feedback:** Replace the full `auth.admin.listUsers()` scan with `supabase.auth.admin.getUserByEmail(email)` — a targeted single-user lookup instead of scanning all users. This is the Supabase-native approach and avoids any custom RPC.

```typescript
// Before (scans ALL users):
const { data: existingUsers } = await supabase.auth.admin.listUsers();
const emailExists = existingUsers?.users?.some(u => u.email?.toLowerCase() === email);

// After (targeted lookup):
const { data: existingUser } = await supabase.auth.admin.getUserByEmail(email);
if (existingUser?.user) {
  throw new Error('Diese E-Mail-Adresse ist bereits registriert.');
}
```

This also eliminates the redundant `profiles` and `handwerker_profiles` email checks that follow, since the auth lookup is authoritative.

---

## Phase 2: Stability & Consistency

### 2.1 Remove dual toast system
Remove Sonner from `App.tsx`. Keep Radix `<Toaster />` only.

### 2.2 Translate error messages to German
Update all 14 messages in `src/lib/errorCategories.ts` from English to German.

### 2.3 Sync LeadStatus config with DB enum (updated with Handwerker impact analysis)

The DB enum has 8 values: `draft, active, closed, cancelled, paused, completed, deleted, expired`. The SSOT config in `leadStatuses.ts` only maps 6 — missing `closed` and `cancelled`.

**Impact analysis on Handwerker workflows:**

- **`cancelled`** is already actively used in `Dashboard.tsx` (client archive flow: `.update({ status: 'cancelled' })` and `.eq('status', 'cancelled')` for fetching archived leads). Handwerkers querying leads with `.eq('status', 'active')` are unaffected — cancelled leads are already excluded. Adding `cancelled` to the config is purely additive (display labels/colors for admin and client views).

- **`closed`** exists in the DB enum but is **not used anywhere in code** — no queries filter by it, no edge functions reference it. Adding it to the config is safe and forward-compatible.

- **No filters or notifications will break** because:
  - Handwerker lead browsing filters on `status = 'active'` only
  - The `send-lead-notification` trigger fires only on `status = 'active'`
  - The `check_lead_expiry` DB function only transitions `active → expired`
  - No saved filter references `closed` or `cancelled` for handwerkers

**Changes to `leadStatuses.ts`:**
- Add `cancelled` entry with label "Abgebrochen", red-orange styling, `canView: false`, `canPurchase: false`
- Add `closed` entry with label "Geschlossen", slate styling, `canView: false`, `canPurchase: false`
- Update the `LeadStatusType` union to include both

This is a config-only addition. No query logic, notification triggers, or Handwerker-facing workflows change.

---

## Phase 3: Code Cleanup

### 3.1 Remove TestDashboard from production routes
Remove the `/test-dashboard` route and lazy import from `App.tsx`.

### 3.2 Strip console.log in production builds
Add `esbuild.drop: ['console', 'debugger']` to `vite.config.ts` for production mode only.

---

## Files Modified

| File | Change |
|------|--------|
| `index.html` | Fix DNS prefetch domain |
| `vercel.json` | Add HSTS + CSP headers |
| `src/App.tsx` | Remove Sonner, remove TestDashboard route |
| `src/lib/errorCategories.ts` | Translate messages to German |
| `src/config/leadStatuses.ts` | Add `cancelled` and `closed` entries |
| `vite.config.ts` | Console stripping for production |
| `supabase/functions/create-handwerker-account/index.ts` | Add auth check |
| `supabase/functions/cleanup-orphaned-records/index.ts` | Add auth check |
| `supabase/functions/create-handwerker-self-registration/index.ts` | Replace `listUsers()` with `getUserByEmail()` |

