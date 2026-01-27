
# Password Reset Fix Plan

## Problem Summary
The password reset functionality is failing because:
1. **Token Detection Race Condition**: The `ResetPassword.tsx` component only listens for the `PASSWORD_RECOVERY` auth event, but this event may fire before the component mounts (or during hydration), causing the token to be missed
2. **Missing Redirect URLs in Supabase**: The production and preview URLs are likely not whitelisted in Supabase's URL Configuration, causing the recovery tokens to be rejected

---

## Solution Overview

### Part 1: Supabase URL Configuration (Manual Step)

You need to add the following URLs to the **Redirect URLs** list in your Supabase Dashboard:

**Navigate to:** `Authentication` → `URL Configuration` → `Redirect URLs`

Add these URLs:
| URL | Purpose |
|-----|---------|
| `https://bueeze.ch/reset-password` | Production |
| `https://*.lovableproject.com/reset-password` | Preview environments (wildcard) |
| `https://bueze.lovable.app/reset-password` | Published Lovable subdomain |

**Direct Link:** https://supabase.com/dashboard/project/ztthhdlhuhtwaaennfia/auth/url-configuration

---

### Part 2: Code Changes to ResetPassword.tsx

#### Issue Analysis
The current implementation relies on catching the `PASSWORD_RECOVERY` event via `onAuthStateChange`. However:
- When Supabase detects recovery tokens in the URL hash, it automatically exchanges them for a session
- The `PASSWORD_RECOVERY` event fires immediately when this happens
- If the React component hasn't mounted yet, the listener misses the event

#### Fix Strategy
1. Add a loading state to prevent flashing "Invalid token" immediately
2. Parse URL hash directly on mount to detect `type=recovery` before relying on events
3. Use `getSession()` to check if Supabase already established a recovery session
4. Add proper timeout before declaring token invalid
5. Follow the deferred async pattern for auth callbacks

#### Changes to `src/pages/ResetPassword.tsx`:

```typescript
export default function ResetPassword() {
  const [isLoading, setIsLoading] = useState(true); // Start with loading state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isValidToken, setIsValidToken] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    // Check if URL hash contains recovery token indicators
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const hasRecoveryParams = hashParams.has('access_token') || 
                              hashParams.has('type') && hashParams.get('type') === 'recovery';
    
    // Listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Defer async operations per Supabase best practices
      setTimeout(() => {
        if (event === 'PASSWORD_RECOVERY') {
          setIsValidToken(true);
          setIsLoading(false);
        } else if (event === 'SIGNED_IN' && session) {
          // Recovery flow sometimes emits SIGNED_IN instead of PASSWORD_RECOVERY
          setIsValidToken(true);
          setIsLoading(false);
        }
      }, 0);
    });

    // Check for existing session (handles case where event already fired)
    const checkExistingSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (session?.user) {
          setIsValidToken(true);
          setIsLoading(false);
          return;
        }
        
        // If URL had recovery params but no session yet, wait a bit for Supabase to process
        if (hasRecoveryParams) {
          // Give Supabase time to process the token exchange
          timeoutId = setTimeout(() => {
            // Final check before declaring invalid
            supabase.auth.getSession().then(({ data: { session: finalSession } }) => {
              if (finalSession?.user) {
                setIsValidToken(true);
              } else {
                setIsValidToken(false);
                toast({
                  title: 'Ungültiger oder abgelaufener Link',
                  description: 'Bitte fordern Sie einen neuen Link zum Zurücksetzen des Passworts an.',
                  variant: 'destructive',
                });
                setTimeout(() => navigate('/auth'), 3000);
              }
              setIsLoading(false);
            });
          }, 2000);
        } else {
          // No recovery params in URL and no session - invalid access
          setIsValidToken(false);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error checking session:', error);
        setIsLoading(false);
        setIsValidToken(false);
      }
    };

    // Start session check
    checkExistingSession();

    return () => {
      subscription.unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [navigate, toast]);

  // Show loading state while checking token
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <CardTitle className="mt-4">Link wird überprüft...</CardTitle>
            <CardDescription>
              Bitte warten Sie einen Moment.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // ... rest of component unchanged
}
```

#### Key Changes Explained:
1. **Loading State**: Start with `isLoading: true` to show a spinner instead of immediately showing "Invalid token"
2. **Hash Detection**: Check `window.location.hash` for `access_token` or `type=recovery` parameters
3. **Deferred Auth Callbacks**: Use `setTimeout(0)` in auth change handlers per project conventions
4. **Fallback Session Check**: Call `getSession()` to catch cases where the token was already processed
5. **Graceful Timeout**: Wait 2 seconds before declaring the token invalid if recovery params were present

---

## Implementation Steps

1. **Add Supabase Redirect URLs** (manual)
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Add the three URLs listed above

2. **Update ResetPassword.tsx**
   - Add loading state with spinner
   - Add URL hash parsing logic
   - Update useEffect with deferred pattern and session checks
   - Add timeout handling for token validation

3. **Test the Flow**
   - Request password reset from /auth
   - Check email and click link
   - Verify page shows loading spinner briefly, then password form
   - Submit new password and confirm success

---

## Technical Notes

- The `PASSWORD_RECOVERY` event only fires once when Supabase processes the token from the URL hash
- React's lazy loading means the component might mount after this event fires
- The deferred async pattern (`setTimeout(0)`) is required per project memory to prevent auth deadlocks
- The 2-second timeout gives Supabase enough time to exchange tokens even on slower connections
