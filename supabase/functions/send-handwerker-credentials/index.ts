import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCorsPreflightRequest, successResponse, errorResponse } from '../_shared/cors.ts';
import { sendEmail } from '../_shared/smtp2go.ts';
import { emailWrapper } from '../_shared/emailTemplates.ts';
import { FRONTEND_URL, SUPPORT_EMAIL } from '../_shared/siteConfig.ts';

// HTML template for credentials email
const credentialsEmailTemplate = (data: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  companyName?: string;
}) => {
  return emailWrapper(`
    <div class="content">
      <h2>Willkommen bei BÜEZE.CH!</h2>
      <p>Hallo ${data.firstName || ''} ${data.lastName || ''},</p>
      <p>Ihr Handwerker-Konto${data.companyName ? ` für ${data.companyName}` : ''} wurde erfolgreich erstellt.</p>
      
      <div class="info-box">
        <h3 style="margin-top: 0; color: #0066CC;">Ihre Zugangsdaten</h3>
        <p><strong>E-Mail:</strong> ${data.email}</p>
        <p><strong>Passwort:</strong> <code style="background: #fff; padding: 4px 8px; border-radius: 3px;">${data.password}</code></p>
      </div>

      <div class="info-box" style="border-left-color: #FF6B00;">
        <p><strong>⚠️ WICHTIG:</strong> Ihr Profil ist derzeit noch in Prüfung. Sie können sich bereits anmelden und Ihr Profil vervollständigen, aber Sie können erst Aufträge durchsuchen, sobald Ihr Profil von unserem Admin-Team freigeschaltet wurde.</p>
      </div>

      <h3 style="color: #0066CC;">Was Sie jetzt tun können:</h3>
      <ul>
        <li>✅ Bei Büeze.ch anmelden</li>
        <li>✅ Ihr Profil vervollständigen (Bio, Preise, Servicegebiete)</li>
        <li>✅ Portfolio-Bilder hochladen</li>
        <li>✅ Ihre Bankdaten hinterlegen</li>
      </ul>

      <p>Sobald Ihr Profil geprüft und freigeschaltet wurde, erhalten Sie eine weitere E-Mail und können dann alle aktiven Aufträge durchsuchen und Offerten abgeben.</p>

      <p style="text-align: center;">
        <a href="${FRONTEND_URL}/auth" class="button">Jetzt anmelden</a>
      </p>

      <p style="font-size: 14px; color: #666;">
        <strong>Sicherheitshinweis:</strong> Wir empfehlen Ihnen, Ihr Passwort nach der ersten Anmeldung zu ändern.
      </p>

      <p style="font-size: 14px; color: #666;">
        Bei Fragen stehen wir Ihnen gerne zur Verfügung unter <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>
      </p>
    </div>
  `);
};

serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  try {
    const { email, password, firstName, lastName, companyName } = await req.json();
    
    if (!email || !password) {
      throw new Error('Missing required fields: email and password are required');
    }

    const subject = '🔑 Willkommen bei Büeze.ch - Ihre Zugangsdaten';
    const htmlBody = credentialsEmailTemplate({
      firstName,
      lastName,
      email,
      password,
      companyName,
    });

    const result = await sendEmail({
      to: email,
      subject,
      htmlBody,
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
    return errorResponse(error as Error);
  }
});
