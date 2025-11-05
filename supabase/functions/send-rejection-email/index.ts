import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { rejectionNotificationTemplate } from "../_shared/emailTemplates.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RejectionEmailRequest {
  email: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  reason?: string;
}

async function sendRejectionEmail(data: RejectionEmailRequest) {
  const smtp2goApiKey = Deno.env.get('SMTP2GO_API_KEY');
  
  if (!smtp2goApiKey) {
    throw new Error('SMTP2GO_API_KEY not configured');
  }

  const htmlBody = rejectionNotificationTemplate({
    firstName: data.firstName,
    lastName: data.lastName,
    companyName: data.companyName,
    reason: data.reason,
    email: data.email,
  });

  const textBody = `
Registrierung nicht genehmigt

Sehr geehrte/r ${data.firstName} ${data.lastName},

Vielen Dank für Ihr Interesse an einer Zusammenarbeit mit Büeze.ch.

Nach sorgfältiger Prüfung Ihrer Unterlagen müssen wir Ihnen leider mitteilen, 
dass wir Ihre Registrierung ${data.companyName ? `für ${data.companyName}` : ''} 
zum jetzigen Zeitpunkt nicht genehmigen können.

${data.reason ? `\nGrund der Ablehnung:\n${data.reason}\n` : ''}

Was Sie tun können:

- Fehlende Dokumente: Falls Dokumente fehlen oder unvollständig sind, können Sie diese nachreichen
- Ungültige Informationen: Überprüfen Sie Ihre angegebenen Daten und korrigieren Sie diese
- Lizenz oder Versicherung: Stellen Sie sicher, dass alle erforderlichen Lizenzen und Versicherungen aktuell sind
- Rückfragen: Kontaktieren Sie uns für weitere Informationen

Kontakt:
E-Mail: info@walia-solutions.ch
Website: www.bueze.ch

Wir bedauern, Ihnen keine positivere Nachricht übermitteln zu können, 
und stehen bei Fragen gerne zur Verfügung.

Mit freundlichen Grüssen
Das Büeze.ch Team
  `;

  try {
    const response = await fetch('https://api.smtp2go.com/v3/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Smtp2go-Api-Key': smtp2goApiKey,
      },
      body: JSON.stringify({
        sender: 'Büeze.ch <noreply@bueze.ch>',
        to: [data.email],
        subject: 'Ihre Registrierung bei Büeze.ch',
        text_body: textBody,
        html_body: htmlBody,
      }),
    });

    const result = await response.json();
    console.log('Rejection email sent:', result);
    
    if (!response.ok) {
      throw new Error(`Email sending failed: ${JSON.stringify(result)}`);
    }

    return result;
  } catch (error) {
    console.error('Error sending rejection email:', error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: RejectionEmailRequest = await req.json();
    
    console.log('Sending rejection email to:', requestData.email);
    
    // Validate required fields
    if (!requestData.email || !requestData.firstName || !requestData.lastName) {
      throw new Error('Missing required fields: email, firstName, lastName');
    }

    await sendRejectionEmail(requestData);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Rejection email sent successfully',
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error in send-rejection-email:', error);
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
