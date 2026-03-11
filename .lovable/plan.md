

# Root Cause: Race Condition in `startedAsGuest` Initialization

## Finding

`startedAsGuest` is initialized as `null` (line 52). The auth check runs async in `useEffect` (line 155). Until it resolves, `startedAsGuest` is `null`.

The step configuration on line 109 uses a ternary:
```tsx
const stepConfig = startedAsGuest
  ? { 1: 'contact', 2: 'services', 3: 'summary' }  // 3 steps, 33%
  : { 1: 'services', 2: 'summary' };                 // 2 steps, 50%
```

Since `null` is falsy, the component initially renders the **authenticated flow** (2 steps, 50% progress) even for guest users. This means:
- Progress bar shows "50% fertig" instead of "33%"
- Step 1 renders 'services' (categories) instead of 'contact' (names, email, password)
- The user cannot enter their name or create an account

Once `checkAuth` resolves and sets `startedAsGuest(true)`, the form flips to 3 steps and "33%". But if the user interacts before that, they see the wrong form. On slow connections, the race window is wider.

## Fix

Show a loading state while `startedAsGuest` is `null`. The form should only render once the auth check has completed and the step configuration is determined.

### File: `src/pages/HandwerkerOnboarding.tsx`

1. Add an early return after the Header/Footer wrapper when `startedAsGuest === null`, showing a centered loading spinner with "Wird geladen..." text
2. This prevents the form from rendering with the wrong step config

```tsx
// After the opening return, before the form card:
if (startedAsGuest === null) {
  return (
    <div className="min-h-screen ...">
      <Header />
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Wird geladen...</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
```

This is a one-file, single-point fix. The `Loader2` icon is already imported (line 19). No other files need changes.

### Why this is the right fix
- It addresses the root cause (rendering before auth state is known) rather than symptoms
- It's consistent with how other protected pages handle the loading state
- The auth check typically resolves in <200ms, so users will barely notice the spinner
- No changes to the step logic, progress calculation, or `useMultiStepForm` hook needed

