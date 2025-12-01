import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Supabase URL and Service Role Key from environment
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Create Supabase client with service role key (has admin privileges)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the requesting user's auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify the requesting user is an admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: requestingUser }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !requestingUser) {
      throw new Error('Unauthorized');
    }

    // Check if requesting user has admin role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', requestingUser.id)
      .in('role', ['admin', 'super_admin'])
      .maybeSingle();

    if (roleError || !roleData) {
      throw new Error('Unauthorized: Admin access required');
    }

    // Parse request body
    const { userId, userEmail, userName } = await req.json();

    if (!userId || !userEmail) {
      throw new Error('Missing required fields: userId and userEmail');
    }

    console.log(`Admin ${requestingUser.email} requesting password reset for user ${userEmail}`);

    // Generate new secure password
    const newPassword = generateSecurePassword(16);

    // Update user's password using admin API
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Error updating password:', updateError);
      throw new Error(`Failed to update password: ${updateError.message}`);
    }

    console.log(`Password successfully reset for user ${userEmail}`);

    // Send email with new credentials (if SMTP is configured)
    try {
      const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
      
      if (RESEND_API_KEY) {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Büeze.ch <noreply@bueeze.ch>',
            to: [userEmail],
            subject: 'Ihr Passwort wurde zurückgesetzt',
            html: `
              <h2>Passwort zurückgesetzt</h2>
              <p>Hallo ${userName || 'Benutzer'},</p>
              <p>Ihr Passwort wurde von einem Administrator zurückgesetzt.</p>
              <p><strong>Ihre neuen Anmeldedaten:</strong></p>
              <ul>
                <li>E-Mail: ${userEmail}</li>
                <li>Neues Passwort: <code>${newPassword}</code></li>
              </ul>
              <p>Bitte ändern Sie Ihr Passwort nach der Anmeldung.</p>
              <p>Sie können sich hier anmelden: <a href="https://bueeze.ch/auth">https://bueeze.ch/auth</a></p>
              <p>Mit freundlichen Grüssen,<br>Ihr Büeze.ch Team</p>
            `,
          }),
        });

        if (!emailResponse.ok) {
          console.error('Failed to send email:', await emailResponse.text());
        } else {
          console.log('Password reset email sent successfully');
        }
      }
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      // Don't throw - password was already reset successfully
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Password reset successfully',
        newPassword: newPassword // Return password so admin can share it if email fails
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