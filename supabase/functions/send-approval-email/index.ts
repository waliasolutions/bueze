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
    const { userId, userName, userEmail } = await req.json();
    
    if (!userId || !userEmail) {
      throw new Error('Missing required fields: userId and userEmail are required');
    }

    const smtp2goApiKey = Deno.env.get('SMTP2GO_API_KEY');
    if (!smtp2goApiKey) {
      throw new Error('SMTP2GO_API_KEY not configured');
    }

    const subject = 'Ihr Büeze.ch Profil wurde freigeschaltet';
    const body = `Hallo ${userName || 'Handwerker'},

Gute Nachrichten! Ihr Handwerker-Profil bei Büeze.ch wurde erfolgreich geprüft und freigeschaltet.

Sie können jetzt:
✅ Alle aktiven Aufträge durchsuchen
✅ Offerten für passende Projekte einreichen
✅ Kontaktdaten erhalten Sie nach Annahme Ihrer Offerte

Hier geht's zu Ihrem Dashboard:
https://bueeze.ch/dashboard

Bei Fragen stehen wir Ihnen gerne zur Verfügung.

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
        to: [userEmail],
        subject: subject,
        text_body: body,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      throw new Error(`Email sending failed: ${JSON.stringify(emailData)}`);
    }

    console.log('Email sent successfully:', { userId, userEmail });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully',
        emailData 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in send-approval-email:', error);
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
