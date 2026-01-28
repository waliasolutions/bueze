
# Fix Password Reset Token Detection

## Problem Diagnosis

The `ResetPassword.tsx` component uses React Router's `useSearchParams()` hook to detect the `?token=` query parameter. However, with lazy-loaded components, this hook may not have the parameters populated on the first render. This causes:

1. `searchParams.get('token')` returns `null` on initial render
2. Code falls through to the legacy Supabase recovery flow (lines 41-106)
3. Since there's no Supabase recovery hash params and no session, it immediately shows "Ungültiger Link"
4. The edge function `validate-password-reset-token` is never called (confirmed: no logs in the function)

The token exists and is valid in the database:
- Token: `8b40c99f...` 
- Email: `info@walia-solutions.ch`
- Expires: `2026-01-28 15:40:28 UTC` (valid)
- Used: `null` (not used)

## Solution

Replace the React Router `useSearchParams()` hook with direct `window.location.search` parsing, which is immediately available when the component mounts.

## Technical Changes

### File: `src/pages/ResetPassword.tsx`

**Change 1: Remove useSearchParams dependency**

Replace:
```typescript
const [searchParams] = useSearchParams();
```

With direct URL parsing inside the useEffect.

**Change 2: Update useEffect to parse URL directly**

```typescript
useEffect(() => {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  // Parse token directly from URL (more reliable than useSearchParams with lazy loading)
  const urlParams = new URLSearchParams(window.location.search);
  const tokenParam = urlParams.get('token');
  
  if (tokenParam) {
    // Custom token flow - token will be validated on submit
    setCustomToken(tokenParam);
    setUseCustomFlow(true);
    setIsValidToken(true);
    setIsLoading(false);
    return;
  }
  
  // Legacy Supabase flow continues below...
}, [navigate, toast]); // Remove searchParams from dependencies
```

**Change 3: Update imports**

Remove `useSearchParams` from react-router-dom import if no longer needed.

## Why This Works

- `window.location.search` is immediately available when JavaScript runs
- No dependency on React Router's async state population
- The token detection happens synchronously on first render
- The edge function will only be called when the user submits the new password (as designed)

## Files to Modify

1. `src/pages/ResetPassword.tsx` - Use direct URL parsing instead of useSearchParams

## Expected Outcome

1. User opens `https://bueeze.ch/reset-password?token=...`
2. Component detects token immediately via `window.location.search`
3. Shows password reset form
4. User enters new password
5. Calls `validate-password-reset-token` edge function
6. Password is updated successfully
