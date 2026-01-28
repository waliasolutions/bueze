
# Fix Password Reset - Complete Solution

## Problem Summary

The password reset flow fails on production (`https://bueeze.ch`) because:

1. **Code not published**: Recent fixes to `ResetPassword.tsx` exist only in the preview environment, not production
2. **Token accidentally used**: During debugging, the edge function was tested directly, marking the token as used
3. **No deployment safeguard**: Changes to auth flows aren't automatically tested on production

---

## Immediate Actions Required

### Step 1: Publish Latest Code to Production

**User Action Required**: Click the "Publish" button in Lovable to deploy the latest code to production.

This will deploy the fix that uses `window.location.search` instead of `useSearchParams()` for reliable token detection.

### Step 2: Generate New Password Reset Token

Since the previous token was accidentally consumed during debugging, we need to trigger a new password reset email.

**After publishing**, the user should:
1. Go to `https://bueeze.ch/auth`
2. Click "Passwort vergessen"
3. Enter `info@walia-solutions.ch`
4. Check email for new branded reset link
5. Click link and verify the form appears

---

## Code Improvements (Additional Safeguards)

### Enhancement 1: Add Debug Logging for Production

Add temporary console logs to help diagnose issues if they recur:

**File: `src/pages/ResetPassword.tsx`**

```typescript
useEffect(() => {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  // Debug logging for production troubleshooting
  console.log('[ResetPassword] Component mounted');
  console.log('[ResetPassword] window.location.search:', window.location.search);
  
  const urlParams = new URLSearchParams(window.location.search);
  const tokenParam = urlParams.get('token');
  
  console.log('[ResetPassword] Parsed token:', tokenParam ? 'present' : 'missing');
  
  if (tokenParam) {
    console.log('[ResetPassword] Using custom token flow');
    setCustomToken(tokenParam);
    setUseCustomFlow(true);
    setIsValidToken(true);
    setIsLoading(false);
    return;
  }
  
  // ... rest of code
}, [navigate, toast]);
```

### Enhancement 2: Add Error Boundary for Token Parsing

Wrap token parsing in try-catch to prevent silent failures:

```typescript
useEffect(() => {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    
    if (tokenParam) {
      setCustomToken(tokenParam);
      setUseCustomFlow(true);
      setIsValidToken(true);
      setIsLoading(false);
      return;
    }
  } catch (error) {
    console.error('[ResetPassword] Error parsing URL:', error);
    // Fall through to legacy flow
  }
  
  // ... legacy Supabase flow
}, [navigate, toast]);
```

### Enhancement 3: Pre-validate Token on Page Load (Optional)

Instead of validating only on submit, validate the token immediately to provide better UX:

```typescript
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const tokenParam = urlParams.get('token');
  
  if (tokenParam) {
    // Validate token immediately
    fetch('https://ztthhdlhuhtwaaennfia.supabase.co/functions/v1/validate-password-reset-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: tokenParam, validateOnly: true })
    })
    .then(res => res.json())
    .then(data => {
      if (data.valid) {
        setCustomToken(tokenParam);
        setUseCustomFlow(true);
        setIsValidToken(true);
      } else {
        setIsValidToken(false);
        toast({
          title: 'Ungültiger oder abgelaufener Link',
          description: 'Bitte fordern Sie einen neuen Link an.',
          variant: 'destructive',
        });
      }
      setIsLoading(false);
    })
    .catch(() => {
      // Fallback: assume token is valid, validate on submit
      setCustomToken(tokenParam);
      setUseCustomFlow(true);
      setIsValidToken(true);
      setIsLoading(false);
    });
    return;
  }
  // ... rest
}, []);
```

This requires updating the edge function to support a `validateOnly` flag.

---

## Edge Function Enhancement

### Update `validate-password-reset-token` to Support Validation Check

**File: `supabase/functions/validate-password-reset-token/index.ts`**

Add support for validating without updating password:

```typescript
const { token, newPassword, validateOnly } = await req.json();

if (!token) {
  return new Response(
    JSON.stringify({ success: false, error: 'Token is required' }),
    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Find and validate token
const { data: tokenData, error: tokenError } = await supabase
  .from('password_reset_tokens')
  .select('*')
  .eq('token', token)
  .is('used_at', null)
  .gt('expires_at', new Date().toISOString())
  .maybeSingle();

if (tokenError || !tokenData) {
  return new Response(
    JSON.stringify({ success: false, valid: false, error: 'Ungültiger oder abgelaufener Link' }),
    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// If validateOnly, just confirm token is valid
if (validateOnly) {
  return new Response(
    JSON.stringify({ success: true, valid: true }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Validate password is provided for actual reset
if (!newPassword) {
  return new Response(
    JSON.stringify({ success: false, error: 'New password is required' }),
    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// ... continue with password update
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/ResetPassword.tsx` | Add debug logging, error handling, optional pre-validation |
| `supabase/functions/validate-password-reset-token/index.ts` | Add `validateOnly` support, use `maybeSingle()` |

---

## Testing Checklist

After publishing:

1. [ ] Generate new password reset from production (`https://bueeze.ch/auth`)
2. [ ] Verify email comes from `noreply@bueeze.ch` (not Supabase)
3. [ ] Verify link points to `https://bueeze.ch/reset-password?token=...` (not lovableproject.com)
4. [ ] Click link and verify password form appears (not "Ungültiger Link")
5. [ ] Enter new password and submit
6. [ ] Verify success message and redirect to login
7. [ ] Login with new password to confirm it works

---

## Why This Happened

| Issue | Root Cause | Prevention |
|-------|------------|------------|
| Preview vs Production mismatch | Auth flow changes weren't published | Always publish after auth-related changes |
| useSearchParams race condition | Lazy loading + React Router async state | Use `window.location.search` directly |
| Token consumed during debug | Edge function tested directly | Use separate test tokens for debugging |
| No visibility into failure | Silent failures in production | Add console logging for critical flows |

---

## Implementation Priority

1. **Critical**: Publish latest code to production
2. **High**: Add debug logging to ResetPassword.tsx
3. **Medium**: Add pre-validation of token on page load
4. **Low**: Remove debug logging after confirming fix works
