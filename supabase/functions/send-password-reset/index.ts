import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { handleCorsPreflightRequest, successResponse, errorResponse } from '../_shared/cors.ts';
import { createSupabaseAdmin } from '../_shared/supabaseClient.ts';
import { sendEmail } from '../_shared/smtp2go.ts';
import { FRONTEND_URL } from '../_shared/siteConfig.ts';

// Generate a secure random token
function generateToken(length: number = 64): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  try {
    const supabase = createSupabaseAdmin();
    const { email } = await req.json();

    if (!email) {
      return errorResponse('Email is required', 400);
    }

    console.log('Password reset requested for email:', email);

    // Targeted lookup via profiles table (avoids loading all auth users)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (profileError) {
      console.error('Error looking up profile:', profileError);
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

    // Store token in database
    const { error: insertError } = await supabase
      .from('password_reset_tokens')
      .insert({
        user_id: profile.id,
        token: token,
        email: email,
        expires_at: expiresAt.toISOString()
      });

    if (insertError) {
      console.error('Error inserting token:', insertError);
      throw insertError;
    }

    // Build reset URL
    const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;

    console.log('Sending password reset email to:', email);

    // Send branded email
    const emailResult = await sendEmail({
      to: email,
      subject: 'Passwort zurücksetzen - Büeze.ch',
      htmlBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1a1a1a; margin: 0;">Büeze.ch</h1>
          </div>
          
          <h2 style="color: #1a1a1a; margin-bottom: 20px;">Passwort zurücksetzen</h2>
          
          <p style="color: #333; line-height: 1.6;">Hallo,</p>
          
          <p style="color: #333; line-height: 1.6;">
            Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts bei Büeze.ch gestellt.
          </p>
          
          <p style="color: #333; line-height: 1.6;">
            Klicken Sie auf den folgenden Button, um ein neues Passwort zu erstellen:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #2563eb; color: white; padding: 14px 28px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;
                      font-weight: 500; font-size: 16px;">
              Passwort zurücksetzen
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            Dieser Link ist <strong>1 Stunde</strong> gültig.
          </p>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            Falls Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail ignorieren. 
            Ihr Passwort bleibt unverändert.
          </p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e5e5;">
          
          <p style="color: #999; font-size: 12px; line-height: 1.6; text-align: center;">
            Mit freundlichen Grüssen,<br>
            Ihr Büeze.ch Team<br>
            <a href="${FRONTEND_URL}" style="color: #2563eb;">${FRONTEND_URL}</a>
          </p>
          
          <p style="color: #999; font-size: 11px; line-height: 1.6; text-align: center; margin-top: 20px;">
            Falls der Button nicht funktioniert, kopieren Sie diesen Link in Ihren Browser:<br>
            <a href="${resetUrl}" style="color: #2563eb; word-break: break-all;">${resetUrl}</a>
          </p>
        </div>
      `
    });

    if (!emailResult.success) {
      console.error('Failed to send email:', emailResult.error);
      throw new Error('Failed to send email');
    }

    console.log('Password reset email sent successfully');

    return successResponse({ success: true, message: 'Reset email sent' });

  } catch (error) {
    console.error('Error in send-password-reset:', error);
    return errorResponse(error as Error, 500);
  }
});
