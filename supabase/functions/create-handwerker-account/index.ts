import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateAccountRequest {
  profileId: string;
  adminId: string | null;
}

function generateSecurePassword(length: number): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  let password = '';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    password += chars[array[i] % chars.length];
  }
  return password;
}

async function sendWelcomeEmail(email: string, data: { name: string; email: string; password: string }) {
  const smtp2goApiKey = Deno.env.get('SMTP2GO_API_KEY');
  
  const emailBody = `Willkommen bei Büeze.ch!

Gute Nachrichten - Ihr Handwerker-Profil wurde erfolgreich geprüft und freigeschaltet!

Ihre Zugangsdaten:
━━━━━━━━━━━━━━━━━━━━
E-Mail: ${data.email}
Passwort: ${data.password}
━━━━━━━━━━━━━━━━━━━━

→ Hier einloggen: https://bueeze.ch/auth

WICHTIG: Aus Sicherheitsgründen empfehlen wir, das Passwort nach der ersten Anmeldung zu ändern.

Sie können jetzt:
✅ Alle aktiven Aufträge durchsuchen
✅ Angebote an interessierte Kunden senden
✅ Direkt mit Auftraggebern kommunizieren

Bei Fragen stehen wir Ihnen gerne zur Verfügung.

Viel Erfolg!
Ihr Büeze.ch Team`;

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">🎉 Willkommen bei Büeze.ch!</h1>
      </div>
      
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 18px; color: #10b981; font-weight: bold; margin-top: 0;">
          Gute Nachrichten - Ihr Handwerker-Profil wurde erfolgreich geprüft und freigeschaltet!
        </p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
          <h2 style="margin-top: 0; color: #667eea;">Ihre Zugangsdaten:</h2>
          <p style="margin: 10px 0;"><strong>E-Mail:</strong> ${data.email}</p>
          <p style="margin: 10px 0;"><strong>Passwort:</strong> <code style="background: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-size: 14px;">${data.password}</code></p>
          
          <div style="background: #f9fafb; padding: 15px; border-radius: 6px; margin-top: 20px;">
            <p style="margin: 0; font-size: 14px; color: #4b5563;">
              <strong>📱 Nach dem ersten Login:</strong><br>
              • Sie gelangen direkt zu Ihrem Dashboard<br>
              • Dort können Sie Ihr Profil bearbeiten (Bio, Telefon, Stundensätze)<br>
              • Aktive Aufträge durchsuchen und Angebote senden<br>
              • Mit Kunden direkt kommunizieren
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://bueeze.ch/auth" style="display: inline-block; background: #667eea; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
            🚀 Jetzt einloggen und loslegen
          </a>
        </div>
        
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin: 20px 0;">
          <p style="margin: 0; color: #92400e;">
            <strong>⚠️ WICHTIG:</strong> Aus Sicherheitsgründen empfehlen wir, das Passwort nach der ersten Anmeldung zu ändern.
          </p>
        </div>
        
        <div style="margin: 30px 0;">
          <h3 style="color: #667eea;">Sie können jetzt:</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">✅ Alle aktiven Aufträge durchsuchen</li>
            <li style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">✅ Angebote an interessierte Kunden senden</li>
            <li style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">✅ Ihr Profil bearbeiten und optimieren</li>
            <li style="padding: 8px 0;">✅ Direkt mit Auftraggebern kommunizieren</li>
          </ul>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
          <p>Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>
          <p style="margin-top: 20px; font-weight: bold; color: #667eea;">Viel Erfolg!</p>
          <p>Ihr Büeze.ch Team</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const response = await fetch('https://api.smtp2go.com/v3/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Smtp2go-Api-Key': smtp2goApiKey!,
      },
      body: JSON.stringify({
        sender: 'Büeze.ch <noreply@bueeze.ch>',
        to: [email],
        subject: '🎉 Ihr Büeze.ch Account ist aktiv!',
        text_body: emailBody,
        html_body: htmlBody,
      }),
    });

    const result = await response.json();
    console.log('Welcome email sent:', result);
    
    if (!response.ok) {
      throw new Error(`Email sending failed: ${JSON.stringify(result)}`);
    }
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profileId, adminId }: CreateAccountRequest = await req.json();
    
    console.log('Creating account for profile:', profileId);
    
    // Create admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // 1. Get handwerker profile data
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from('handwerker_profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (fetchError) {
      console.error('Error fetching profile:', fetchError);
      throw new Error(`Profile not found: ${fetchError.message}`);
    }
    
    if (!profile) {
      throw new Error('Profile not found');
    }
    
    if (profile.user_id) {
      throw new Error('Account already exists for this profile');
    }

    console.log('Profile found:', { email: profile.email, name: `${profile.first_name} ${profile.last_name}` });

    // 2. Generate secure random password
    const password = generateSecurePassword(12);
    console.log('Generated secure password');

    // 3. Create auth.users account
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: profile.email,
      password: password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: `${profile.first_name} ${profile.last_name}`,
        role: 'handwerker',
        phone: profile.phone_number,
      }
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      throw new Error(`Failed to create auth account: ${authError.message}`);
    }

    console.log('Auth user created:', authUser.user.id);

    // 4. Update handwerker_profiles with user_id
    const { error: updateError } = await supabaseAdmin
      .from('handwerker_profiles')
      .update({
        user_id: authUser.user.id,
        is_verified: true,
        verification_status: 'approved',
        verified_at: new Date().toISOString(),
        verified_by: adminId,
      })
      .eq('id', profileId);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      throw new Error(`Failed to update profile: ${updateError.message}`);
    }

    console.log('Profile updated with user_id');

    // Note: user_roles entry is automatically created by handle_new_user() trigger

    // 6. Send welcome email with credentials
    await sendWelcomeEmail(profile.email, {
      name: `${profile.first_name} ${profile.last_name}`,
      email: profile.email,
      password: password,
    });

    console.log('Welcome email sent successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        userId: authUser.user.id,
        message: 'Account created successfully and welcome email sent',
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error in create-handwerker-account:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error occurred',
        success: false,
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
