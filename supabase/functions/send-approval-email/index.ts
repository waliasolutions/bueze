import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCorsPreflightRequest, successResponse, errorResponse } from '../_shared/cors.ts';
import { sendEmail } from '../_shared/smtp2go.ts';

serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  try {
    const { userId, userName, userEmail } = await req.json();
    
    if (!userId || !userEmail) {
      throw new Error('Missing required fields: userId and userEmail are required');
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

    const result = await sendEmail({
      to: userEmail,
      subject,
      textBody: body,
    });

    if (!result.success) {
      throw new Error(result.error || 'Email sending failed');
    }

    console.log('Email sent successfully:', { userId, userEmail });

    return successResponse({ 
      success: true, 
      message: 'Email sent successfully',
    });
  } catch (error) {
    console.error('Error in send-approval-email:', error);
    return errorResponse(error);
  }
});
