

# Fix: Strict Role Isolation for Admin View Switching

## Problem Summary

When an Admin logs in and switches to "Client" view, the Profile page still shows Handwerker tabs because it checks the database (`!!handwerkerProfile`) instead of the intended view mode. There is no global state tracking which view the admin has selected -- the AdminViewSwitcher is just a navigation shortcut with no memory.

## Solution: ViewMode Context with Emergency Exit & Visual Feedback

### New File: `src/contexts/ViewModeContext.tsx`

A lightweight React context that:
- Stores `activeView: ViewMode` where `type ViewMode = 'admin' | 'client' | 'handwerker'`
- Defaults to the user's primary database role (non-admins always get their real role)
- Persists to `sessionStorage` for admin users so it survives page refreshes
- **Emergency Exit**: Clears `sessionStorage` on `SIGNED_OUT` auth event AND when the `userId` changes (different user logs in). This prevents stale view modes from leaking between sessions.
- Exposes `setActiveView(view)`, `activeView`, and `isImpersonating` (true when admin views as non-admin)
- Only admin users can change views; for all other users, the context is read-only and mirrors their real role

### Modified Files (5 files)

**1. `src/App.tsx`**
- Wrap the router contents with `<ViewModeProvider>` (inside BrowserRouter so it can access useUserRole)

**2. `src/components/AdminViewSwitcher.tsx`**
- Import and use `useViewMode()` from context
- Remove the `currentView` prop (no longer derived from URL)
- Call `setActiveView(view)` before navigating
- Read `activeView` from context to show current selection

**3. `src/components/Header.tsx`**
- Remove the `getCurrentView()` function and the `currentView` prop passed to AdminViewSwitcher
- AdminViewSwitcher now manages its own state via context

**4. `src/pages/Profile.tsx`**
- Import `useViewMode()` 
- Replace `const isHandwerker = !!handwerkerProfile` with view-aware logic:
  - If admin is in "client" view: `isHandwerker = false` (hide Handwerker tabs)
  - If admin is in "handwerker" view: `isHandwerker = !!handwerkerProfile` (show if data exists)
  - If admin is in "admin" view or not admin: use existing database logic
- Fix `handleBackNavigation` to use `activeView` instead of database role

**5. `src/components/UserDropdown.tsx`**
- Import `useViewMode()`
- Use `activeView` to determine which navigation items to show:
  - `activeView === 'handwerker'` -> `roleNavigation.handwerker`
  - `activeView === 'client'` -> `roleNavigation.client`
  - `activeView === 'admin'` -> admin-specific items (link to `/admin`)
- Use `activeView` for the role label display

### New Component: Impersonation Banner

Add a persistent banner at the top of the page when `isImpersonating === true`. This will be rendered inside `Header.tsx` (below the main header bar) as a slim colored strip:

- **Client view**: Blue banner -- "Sie sehen die Plattform als Kunde" with a button "Zurück zur Admin-Ansicht"
- **Handwerker view**: Green banner -- "Sie sehen die Plattform als Handwerker" with a button "Zurück zur Admin-Ansicht"
- Clicking "Zurück" calls `setActiveView('admin')` and navigates to `/admin/dashboard`
- Banner is only visible to admin users when impersonating

This gives admins a constant, unmissable reminder of which view they are in, preventing confusion.

## Technical Details

### ViewModeContext Implementation

```text
ViewModeProvider
  Props: children
  Internal state:
    - activeView: ViewMode (from sessionStorage or derived from useUserRole)
    - setActiveView(view: ViewMode): updates state + sessionStorage

  Emergency exit logic:
    - onAuthStateChange('SIGNED_OUT') -> clear sessionStorage key, reset to null
    - userId changes (new login) -> clear sessionStorage, re-derive from new user's role
    - Non-admin user -> always returns their real role, setActiveView is a no-op

  sessionStorage key: 'bueze_admin_view_mode'
```

### Type Safety

```text
type ViewMode = 'admin' | 'client' | 'handwerker';

interface ViewModeContextValue {
  activeView: ViewMode;
  setActiveView: (view: ViewMode) => void;
  isImpersonating: boolean;  // true when admin views as client/handwerker
}
```

### State Flow After Fix

```text
Admin clicks "Kunden-Ansicht" in AdminViewSwitcher
  -> setActiveView('client') updates context + sessionStorage
  -> navigate('/dashboard')
  -> Blue banner appears: "Sie sehen die Plattform als Kunde"
  -> UserDropdown shows client nav items + "Kunde" role label
  -> Clicking "Profil" goes to /profile
  -> Profile sees activeView='client', hides Handwerker tabs
  -> Back button returns to /dashboard (not /admin)
  -> Page refresh: sessionStorage restores activeView='client'
  -> Logout: sessionStorage cleared, context reset
  -> New login as different user: sessionStorage cleared, fresh role derived
```

### What Does NOT Change
- Database roles remain untouched (security layer)
- `useUserRole` hook continues returning real database roles
- RLS policies use real database roles (no security impact)
- Non-admin users are completely unaffected
- Auth guards continue to use real roles
- AdminAuthContext is unchanged

### Files Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/contexts/ViewModeContext.tsx` | CREATE | ViewMode state with sessionStorage + emergency exit |
| `src/App.tsx` | MODIFY | Wrap with ViewModeProvider |
| `src/components/AdminViewSwitcher.tsx` | MODIFY | Use context instead of URL-derived prop |
| `src/components/Header.tsx` | MODIFY | Remove getCurrentView, add impersonation banner |
| `src/pages/Profile.tsx` | MODIFY | Use activeView for tab visibility + back nav |
| `src/components/UserDropdown.tsx` | MODIFY | Use activeView for nav items + role label |

