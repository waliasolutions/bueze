import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { handleCorsPreflightRequest, successResponse, errorResponse } from '../_shared/cors.ts';
import { createSupabaseAdmin } from '../_shared/supabaseClient.ts';
import { sendEmail } from '../_shared/smtp2go.ts';
import { passwordResetTemplate } from '../_shared/emailTemplates.ts';
import { FRONTEND_URL } from '../_shared/siteConfig.ts';
import { getErrorMessage } from '../_shared/errorUtils.ts';

// Generate a secure random token
function generateToken(length: number = 64): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Fire-and-forget failure logging into public.app_error_log so support can
 * reconstruct reset problems later (reset tokens themselves expire after 1h).
 */
async function logFailure(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  step: string,
  email: string | null,
  userId: string | null,
  detail: unknown,
) {
  try {
    await supabase.from('app_error_log').insert({
      user_id: userId,
      user_email: email,
      context: 'password_reset',
      category: 'auth',
      severity: 'error',
      message: `Passwort-Reset fehlgeschlagen (${step})`,
      detail: getErrorMessage(detail),
      route: '/auth?mode=reset',
      metadata: { step, edge_function: 'send-password-reset' },
    });
  } catch (e) {
    console.error('Failed to persist password reset failure:', e);
  }
}

serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  const supabase = createSupabaseAdmin();
  let email: string | null = null;

  try {
    const body = await req.json();
    email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : null;

    if (!email) {
      return errorResponse('Email is required', 400);
    }

    console.log('Password reset requested for email:', email);

    // Targeted lookup via profiles table (avoids loading all auth users)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (profileError) {
      await logFailure(supabase, 'profile_lookup', email, null, profileError);
      throw profileError;
    }

    if (!profile) {
      // Don't reveal if user exists - return success anyway
      console.log('User not found, returning success anyway for security');
      return successResponse({ success: true, message: 'If an account exists, a reset email was sent.' });
    }

    // Generate secure token
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    const { error: insertError } = await supabase
      .from('password_reset_tokens')
      .insert({
        user_id: profile.id,
        token,
        email,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      await logFailure(supabase, 'token_insert', email, profile.id, insertError);
      throw insertError;
    }

    const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;

    const emailResult = await sendEmail({
      to: email,
      subject: 'Passwort zurücksetzen - Büeze.ch',
      htmlBody: passwordResetTemplate({ resetUrl }),
    });

    if (!emailResult.success) {
      await logFailure(supabase, 'email_send', email, profile.id, emailResult.error ?? 'unknown SMTP2GO error');
      return errorResponse('Email could not be sent', 502);
    }

    console.log('Password reset email sent successfully to:', email);

    return successResponse({ success: true, message: 'Reset email sent' });

  } catch (error) {
    console.error('Error in send-password-reset:', error);
    await logFailure(supabase, 'unhandled', email, null, error);
    return errorResponse(error as Error, 500);
  }
});
