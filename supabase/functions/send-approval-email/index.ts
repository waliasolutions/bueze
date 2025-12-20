import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCorsPreflightRequest, successResponse, errorResponse } from '../_shared/cors.ts';
import { sendEmail } from '../_shared/smtp2go.ts';
import { emailWrapper } from '../_shared/emailTemplates.ts';

// HTML template for approval email
const approvalEmailTemplate = (userName: string) => {
  return emailWrapper(`
    <div class="content">
      <h2>🎉 Ihr Profil wurde freigeschaltet!</h2>
      <p>Hallo ${userName || 'Handwerker'},</p>
      <p>Gute Nachrichten! Ihr Handwerker-Profil bei Büeze.ch wurde erfolgreich geprüft und freigeschaltet.</p>
      
      <div class="info-box">
        <h3 style="margin-top: 0; color: #0066CC;">Sie können jetzt:</h3>
        <ul style="margin: 0; padding-left: 20px;">
          <li>✅ Alle aktiven Aufträge durchsuchen</li>
          <li>✅ Offerten für passende Projekte einreichen</li>
          <li>✅ Kontaktdaten erhalten Sie nach Annahme Ihrer Offerte</li>
        </ul>
      </div>

      <p style="text-align: center;">
        <a href="https://bueeze.ch/handwerker-dashboard" class="button">Zum Handwerker-Dashboard</a>
      </p>

      <p style="font-size: 14px; color: #666;">
        Bei Fragen stehen wir Ihnen gerne zur Verfügung unter <a href="mailto:info@bueeze.ch">info@bueeze.ch</a>
      </p>
    </div>
  `);
};

serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  try {
    const { userId, userName, userEmail } = await req.json();
    
    if (!userId || !userEmail) {
      throw new Error('Missing required fields: userId and userEmail are required');
    }

    const subject = '🎉 Ihr Büeze.ch Profil wurde freigeschaltet';
    const htmlBody = approvalEmailTemplate(userName);

    const result = await sendEmail({
      to: userEmail,
      subject,
      htmlBody,
    });

    if (!result.success) {
      throw new Error(result.error || 'Email sending failed');
    }

    console.log('Approval email sent successfully:', { userId, userEmail });

    return successResponse({ 
      success: true, 
      message: 'Email sent successfully',
    });
  } catch (error) {
    console.error('Error in send-approval-email:', error);
    return errorResponse(error);
  }
});
