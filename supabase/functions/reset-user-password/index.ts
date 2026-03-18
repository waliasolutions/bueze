import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { corsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { sendEmail } from '../_shared/smtp2go.ts';
import { FRONTEND_URL } from '../_shared/siteConfig.ts';

// Generate a secure random password
function generateSecurePassword(length: number = 16): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map(x => charset[x % charset.length])
    .join('');
}

serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: requestingUser }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !requestingUser) {
      throw new Error('Unauthorized');
    }

    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', requestingUser.id)
      .in('role', ['admin', 'super_admin'])
      .maybeSingle();

    if (roleError || !roleData) {
      throw new Error('Unauthorized: Admin access required');
    }

    const { userId, userEmail, userName } = await req.json();

    if (!userId || !userEmail) {
      throw new Error('Missing required fields: userId and userEmail');
    }

    console.log(`Admin ${requestingUser.email} requesting password reset for user ${userEmail}`);

    const newPassword = generateSecurePassword(16);

    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Error updating password:', updateError);
      throw new Error(`Failed to update password: ${updateError.message}`);
    }

    console.log(`Password successfully reset for user ${userEmail}`);

    // Send email with new credentials via SMTP2GO
    const emailResult = await sendEmail({
      to: userEmail,
      subject: 'Ihr Passwort wurde zurückgesetzt - Büeze.ch',
      htmlBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1a1a1a; margin: 0;">Büeze.ch</h1>
          </div>
          <h2 style="color: #1a1a1a;">Passwort zurückgesetzt</h2>
          <p style="color: #333; line-height: 1.6;">Hallo ${userName || 'Benutzer'},</p>
          <p style="color: #333; line-height: 1.6;">Ihr Passwort wurde von einem Administrator zurückgesetzt.</p>
          <p style="color: #333; line-height: 1.6;"><strong>Ihre neuen Anmeldedaten:</strong></p>
          <ul style="color: #333; line-height: 1.8;">
            <li>E-Mail: ${userEmail}</li>
            <li>Neues Passwort: <code style="background: #f4f4f4; padding: 2px 6px; border-radius: 3px;">${newPassword}</code></li>
          </ul>
          <p style="color: #333; line-height: 1.6;">Bitte ändern Sie Ihr Passwort nach der Anmeldung.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${FRONTEND_URL}/auth" style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">Jetzt anmelden</a>
          </div>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e5e5;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            Mit freundlichen Grüssen,<br>Ihr Büeze.ch Team
          </p>
        </div>
      `,
    });

    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult.error);
    } else {
      console.log('Password reset email sent successfully via SMTP2GO');
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Password reset successfully. Das neue Passwort wurde per E-Mail gesendet.',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in reset-user-password function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
