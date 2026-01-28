
# Password Reset Email Improvements Plan

## Problem Analysis

You've identified three interconnected issues with password reset:

### Issue 1: Email Sender/Branding
**Current:** Emails come from Supabase's default sender (`noreply@mail.app.supabase.io`)
**Expected:** Emails should come from `noreply@bueeze.ch` with company branding

### Issue 2: Reset Link Shows Preview URL
**Current:** `Auth.tsx` line 196 uses `${window.location.origin}/reset-password`, which when triggered from the preview environment, generates links like `https://c3925526-0718-45ee-98c5-5672613b617e.lovableproject.com/reset-password`
**Expected:** Links should always use `https://bueeze.ch/reset-password`

### Issue 3: "Ungültiger Link" Error + No Redirect
**Root Cause:** The recovery token was issued for a lovableproject.com URL, but when you click the link, Supabase cannot exchange the token because the URL in the email doesn't match what's whitelisted (or the token exchange fails). The component shows "Ungültiger Link" but the 3-second redirect in `ResetPassword.tsx` line 72 may not trigger reliably.

---

## Solution Overview

### Part 1: Custom Password Reset Email via Edge Function

Instead of relying on Supabase's built-in recovery email (which uses their default SMTP), we will:
1. Create a new edge function `send-password-reset` that uses SMTP2GO (already configured)
2. Generate a magic token stored in the database
3. Send a branded email with the production URL
4. Update the frontend to use this custom flow

### Part 2: Hardcode Production URL

Change `Auth.tsx` to use `https://bueeze.ch/reset-password` instead of `window.location.origin` to ensure all reset links point to production.

### Part 3: Improve Error Handling in ResetPassword.tsx

Fix the redirect that isn't happening by using a more reliable redirect mechanism.

---

## Detailed Implementation

### Step 1: Create Magic Token Table (Database Migration)

Create a table to store password reset tokens:

```sql
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '1 hour'),
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast token lookup
CREATE INDEX idx_password_reset_tokens_token ON public.password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_expires ON public.password_reset_tokens(expires_at);

-- RLS policies
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Only the system should interact with this table (via edge functions with service role)
CREATE POLICY "No direct access to password_reset_tokens"
  ON public.password_reset_tokens FOR ALL
  USING (false);
```

### Step 2: Create Edge Function `send-password-reset`

**File:** `supabase/functions/send-password-reset/index.ts`

This edge function will:
- Accept an email address
- Look up the user in auth.users
- Generate a secure token
- Store it in `password_reset_tokens`
- Send a branded email via SMTP2GO with the production URL

```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { sendEmail } from '../_shared/smtp2go.ts';
import { corsHeaders } from '../_shared/cors.ts';

// Generate a secure random token
function generateToken(length: number = 64): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

const PRODUCTION_URL = 'https://bueeze.ch';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email } = await req.json();

    if (!email) {
      throw new Error('Email is required');
    }

    // Find user by email
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) throw userError;
    
    const user = userData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      // Don't reveal if user exists - return success anyway
      return new Response(
        JSON.stringify({ success: true, message: 'If an account exists, a reset email was sent.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate secure token
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store token in database
    const { error: insertError } = await supabase
      .from('password_reset_tokens')
      .insert({
        user_id: user.id,
        token: token,
        email: email,
        expires_at: expiresAt.toISOString()
      });

    if (insertError) throw insertError;

    // Build reset URL
    const resetUrl = `${PRODUCTION_URL}/reset-password?token=${token}`;

    // Send branded email
    const emailResult = await sendEmail({
      to: email,
      subject: 'Passwort zurücksetzen - Büeze.ch',
      htmlBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a1a1a;">Passwort zurücksetzen</h2>
          <p>Hallo,</p>
          <p>Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts bei Büeze.ch gestellt.</p>
          <p>Klicken Sie auf den folgenden Link, um ein neues Passwort zu erstellen:</p>
          <p style="margin: 20px 0;">
            <a href="${resetUrl}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;">
              Passwort zurücksetzen
            </a>
          </p>
          <p>Dieser Link ist 1 Stunde gültig.</p>
          <p>Falls Sie diese Anfrage nicht gestellt haben, ignorieren Sie diese E-Mail.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e5e5;">
          <p style="color: #666; font-size: 12px;">
            Mit freundlichen Grüssen,<br>
            Ihr Büeze.ch Team<br>
            <a href="https://bueeze.ch">https://bueeze.ch</a>
          </p>
        </div>
      `
    });

    if (!emailResult.success) {
      throw new Error('Failed to send email');
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Reset email sent' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

### Step 3: Create Edge Function `validate-password-reset-token`

**File:** `supabase/functions/validate-password-reset-token/index.ts`

This function validates the token and updates the user's password:

```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { token, newPassword } = await req.json();

    if (!token || !newPassword) {
      throw new Error('Token and new password are required');
    }

    // Find and validate token
    const { data: tokenData, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('token', token)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (tokenError || !tokenData) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or expired token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update user's password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      tokenData.user_id,
      { password: newPassword }
    );

    if (updateError) throw updateError;

    // Mark token as used
    await supabase
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenData.id);

    return new Response(
      JSON.stringify({ success: true, message: 'Password updated successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

### Step 4: Update Auth.tsx

Change the password reset handler to call the custom edge function:

```typescript
const handlePasswordReset = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!resetEmail) {
    toast({
      title: 'Fehler',
      description: 'Bitte geben Sie Ihre E-Mail-Adresse ein.',
      variant: 'destructive',
    });
    return;
  }

  setIsResetting(true);

  try {
    const response = await fetch(
      'https://ztthhdlhuhtwaaennfia.supabase.co/functions/v1/send-password-reset',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to send reset email');
    }

    toast({
      title: 'E-Mail gesendet',
      description: 'Bitte überprüfen Sie Ihren Posteingang für den Link zum Zurücksetzen des Passworts.',
    });
    setIsDialogOpen(false);
    setResetEmail('');
  } catch (error) {
    toast({
      title: 'Fehler',
      description: 'Ein unerwarteter Fehler ist aufgetreten.',
      variant: 'destructive',
    });
  } finally {
    setIsResetting(false);
  }
};
```

### Step 5: Update ResetPassword.tsx

Rewrite to handle custom token validation instead of Supabase's auth flow:

```typescript
export default function ResetPassword() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isValidToken, setIsValidToken] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Get token from URL query params
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    
    if (tokenParam) {
      setToken(tokenParam);
      setIsValidToken(true);
      setIsLoading(false);
    } else {
      // No token in URL - check for Supabase recovery flow (backward compatibility)
      // ... existing Supabase recovery logic ...
    }
  }, []);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation...

    setIsSubmitting(true);

    try {
      const response = await fetch(
        'https://ztthhdlhuhtwaaennfia.supabase.co/functions/v1/validate-password-reset-token',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, newPassword: password })
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast({
          title: 'Fehler',
          description: data.error || 'Ungültiger oder abgelaufener Link.',
          variant: 'destructive',
        });
        return;
      }

      setIsSuccess(true);
      toast({
        title: 'Passwort aktualisiert',
        description: 'Ihr Passwort wurde erfolgreich geändert.',
      });
      
      setTimeout(() => navigate('/auth'), 3000);
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Ein unerwarteter Fehler ist aufgetreten.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ... rest of component
}
```

### Step 6: Add Edge Functions to config.toml

Add the new functions:

```toml
[functions.send-password-reset]
verify_jwt = false

[functions.validate-password-reset-token]
verify_jwt = false
```

---

## Technical Summary

| Issue | Root Cause | Solution |
|-------|------------|----------|
| Email from Supabase | Using Supabase's built-in recovery email | Custom edge function with SMTP2GO |
| Preview URL in links | `window.location.origin` used | Hardcoded production URL in edge function |
| "Ungültiger Link" error | Supabase token exchange failing | Custom token system with database storage |

---

## Files to Create/Modify

1. **Database Migration:** Create `password_reset_tokens` table
2. **Create:** `supabase/functions/send-password-reset/index.ts`
3. **Create:** `supabase/functions/validate-password-reset-token/index.ts`
4. **Modify:** `supabase/config.toml` (add function configs)
5. **Modify:** `src/pages/Auth.tsx` (use custom reset endpoint)
6. **Modify:** `src/pages/ResetPassword.tsx` (handle custom token flow)

---

## Benefits

- All reset emails come from `noreply@bueeze.ch` with company branding
- Reset links always point to `https://bueeze.ch/reset-password`
- Preview/staging URLs are never exposed to end users
- Token validation is under your control
- Improved error handling and user feedback
