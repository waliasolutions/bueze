import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password, firstName, lastName, companyName } = await req.json();
    
    if (!email || !password) {
      throw new Error('Missing required fields: email and password are required');
    }

    const smtp2goApiKey = Deno.env.get('SMTP2GO_API_KEY');
    if (!smtp2goApiKey) {
      throw new Error('SMTP2GO_API_KEY not configured');
    }

    const subject = 'Willkommen bei Büeze.ch - Ihre Zugangsdaten';
    const body = `Hallo ${firstName || ''} ${lastName || ''},

Willkommen bei Büeze.ch! Ihr Handwerker-Konto wurde erfolgreich erstellt.

Ihre Zugangsdaten:
📧 E-Mail: ${email}
🔑 Passwort: ${password}

⚠️ WICHTIG: Ihr Profil ist derzeit noch in Prüfung. Sie können sich bereits anmelden und Ihr Profil vervollständigen, aber Sie können erst Aufträge durchsuchen, sobald Ihr Profil von unserem Admin-Team freigeschaltet wurde.

Was Sie jetzt tun können:
✅ Bei Büeze.ch anmelden
✅ Ihr Profil vervollständigen (Bio, Preise, Servicegebiete)
✅ Portfolio-Bilder hochladen
✅ Ihre Bankdaten hinterlegen

Sobald Ihr Profil geprüft und freigeschaltet wurde, erhalten Sie eine weitere E-Mail und können dann alle aktiven Aufträge durchsuchen und Offerten abgeben.

Hier geht's zur Anmeldung:
https://bueze.ch/auth

Wir empfehlen Ihnen, Ihr Passwort nach der ersten Anmeldung zu ändern.

Bei Fragen stehen wir Ihnen gerne zur Verfügung unter info@bueeze.ch

Viel Erfolg!
Ihr Büeze.ch Team`;

    const emailResponse = await fetch('https://api.smtp2go.com/v3/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Smtp2go-Api-Key': smtp2goApiKey,
      },
      body: JSON.stringify({
        sender: 'noreply@bueeze.ch',
        to: [email],
        subject: subject,
        text_body: body,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      throw new Error(`Email sending failed: ${JSON.stringify(emailData)}`);
    }

    console.log('Welcome email sent successfully:', { email, companyName });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Welcome email sent successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in send-handwerker-credentials:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
