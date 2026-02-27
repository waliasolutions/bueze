import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { sendEmail } from '../_shared/smtp2go.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { FRONTEND_URL } from '../_shared/siteConfig.ts';

// Generate a secure random token
function generateToken(length: number = 64): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

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

    console.log('Password reset requested for email:', email);

    // Find user by email
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('Error listing users:', userError);
      throw userError;
    }
    
    const user = userData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      // Don't reveal if user exists - return success anyway
      console.log('User not found, returning success anyway for security');
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

    return new Response(
      JSON.stringify({ success: true, message: 'Reset email sent' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-password-reset:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
