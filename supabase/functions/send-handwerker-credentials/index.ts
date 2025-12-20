import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCorsPreflightRequest, successResponse, errorResponse } from '../_shared/cors.ts';
import { sendEmail } from '../_shared/smtp2go.ts';

serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  try {
    const { email, password, firstName, lastName, companyName } = await req.json();
    
    if (!email || !password) {
      throw new Error('Missing required fields: email and password are required');
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
https://bueeze.ch/auth

Wir empfehlen Ihnen, Ihr Passwort nach der ersten Anmeldung zu ändern.

Bei Fragen stehen wir Ihnen gerne zur Verfügung unter info@bueeze.ch

Viel Erfolg!
Ihr Büeze.ch Team`;

    const result = await sendEmail({
      to: email,
      subject,
      textBody: body,
    });

    if (!result.success) {
      throw new Error(result.error || 'Email sending failed');
    }

    console.log('Welcome email sent successfully:', { email, companyName });

    return successResponse({ 
      success: true, 
      message: 'Welcome email sent successfully'
    });
  } catch (error) {
    console.error('Error in send-handwerker-credentials:', error);
    return errorResponse(error);
  }
});
