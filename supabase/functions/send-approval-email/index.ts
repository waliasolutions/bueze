import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCorsPreflightRequest, successResponse, errorResponse } from '../_shared/cors.ts';
import { sendEmail } from '../_shared/smtp2go.ts';
import { emailWrapper } from '../_shared/emailTemplates.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Plan display names
const PLAN_NAMES: Record<string, string> = {
  monthly: 'Monatlich (CHF 90)',
  '6_month': '6 Monate (CHF 510)',
  annual: 'Jährlich (CHF 960)',
};

// HTML template for approval email - standard (no pending plan)
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

// HTML template for approval email with pending plan - includes payment CTA
const approvalWithPlanEmailTemplate = (userName: string, planName: string, pendingPlan: string) => {
  const paymentUrl = `https://bueeze.ch/checkout?plan=${pendingPlan}`;
  const cancelUrl = `https://bueeze.ch/profile?tab=subscription&cancel_pending=true`;
  
  return emailWrapper(`
    <div class="content">
      <h2>🎉 Profil freigeschaltet - Jetzt Abo aktivieren</h2>
      <p>Hallo ${userName || 'Handwerker'},</p>
      <p>Gute Nachrichten! Ihr Handwerker-Profil bei Büeze.ch wurde erfolgreich geprüft und freigeschaltet.</p>
      
      <div class="info-box" style="background: #f0f9ff; border: 1px solid #0066CC; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #0066CC;">Ihr ausgewähltes Abonnement</h3>
        <p style="font-size: 18px; font-weight: bold; margin: 10px 0;">${planName}</p>
        <p style="margin: 0; color: #666;">
          Mit unbegrenzten Offerten können Sie sofort mehr Aufträge gewinnen.
        </p>
      </div>

      <p style="text-align: center;">
        <a href="${paymentUrl}" class="button" style="background: #0066CC; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-size: 18px; display: inline-block; font-weight: bold;">
          💳 Jetzt bezahlen und starten
        </a>
      </p>

      <div class="info-box" style="margin-top: 30px;">
        <h3 style="margin-top: 0; color: #0066CC;">Mit Ihrem Abo können Sie:</h3>
        <ul style="margin: 0; padding-left: 20px;">
          <li>✅ Unbegrenzt Offerten einreichen</li>
          <li>✅ Alle aktiven Aufträge durchsuchen</li>
          <li>✅ Kontaktdaten nach Annahme Ihrer Offerte erhalten</li>
        </ul>
      </div>

      <p style="text-align: center; margin-top: 20px;">
        <a href="https://bueeze.ch/handwerker-dashboard" style="color: #0066CC; text-decoration: underline;">
          Oder erstmal kostenlos starten (5 Offerten/Monat)
        </a>
      </p>

      <p style="font-size: 14px; color: #666; margin-top: 30px;">
        <strong>Plan ändern?</strong> Sie können Ihren ausgewählten Plan jederzeit 
        <a href="${cancelUrl}">hier stornieren</a> und auf dem kostenlosen Plan bleiben.
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

    // Create Supabase client to check for pending plan
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check if user has a pending plan
    const { data: subscription } = await supabase
      .from('handwerker_subscriptions')
      .select('pending_plan')
      .eq('user_id', userId)
      .maybeSingle();

    const pendingPlan = subscription?.pending_plan;
    const planName = pendingPlan ? PLAN_NAMES[pendingPlan] || pendingPlan : null;

    // Choose appropriate email template
    let subject: string;
    let htmlBody: string;

    if (pendingPlan && planName) {
      subject = '🎉 Profil freigeschaltet - Jetzt Abo aktivieren';
      htmlBody = approvalWithPlanEmailTemplate(userName, planName, pendingPlan);
    } else {
      subject = '🎉 Ihr Büeze.ch Profil wurde freigeschaltet';
      htmlBody = approvalEmailTemplate(userName);
    }

    const result = await sendEmail({
      to: userEmail,
      subject,
      htmlBody,
    });

    if (!result.success) {
      throw new Error(result.error || 'Email sending failed');
    }

    console.log('Approval email sent successfully:', { 
      userId, 
      userEmail,
      hasPendingPlan: !!pendingPlan,
      pendingPlan: pendingPlan || 'none'
    });

    return successResponse({ 
      success: true, 
      message: 'Email sent successfully',
      hasPendingPlan: !!pendingPlan,
    });
  } catch (error) {
    console.error('Error in send-approval-email:', error);
    return errorResponse(error);
  }
});
