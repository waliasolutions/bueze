import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Subscription confirmation email template
const subscriptionConfirmationTemplate = (data: {
  handwerkerName: string;
  planName: string;
  planType: string;
  periodEnd: string;
  amount: string;
}) => `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
    }
    .header {
      background: #0066CC;
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: bold;
    }
    .content {
      padding: 30px 20px;
    }
    .button {
      display: inline-block;
      background: #0066CC;
      color: white !important;
      padding: 14px 28px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
      font-weight: 600;
    }
    .info-box {
      background: #f8f9fa;
      border-left: 4px solid #0066CC;
      padding: 15px;
      margin: 20px 0;
    }
    .success-box {
      background: #d1fae5;
      border-left: 4px solid #10b981;
      padding: 15px;
      margin: 20px 0;
    }
    .footer {
      background: #f5f5f5;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #666666;
      border-top: 1px solid #e0e0e0;
    }
    .footer a {
      color: #0066CC;
      text-decoration: none;
    }
    h2 {
      color: #0066CC;
      margin-top: 0;
    }
    .feature-list {
      list-style: none;
      padding: 0;
    }
    .feature-list li {
      padding: 8px 0;
      padding-left: 25px;
      position: relative;
    }
    .feature-list li::before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #10b981;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>BÜEZE.CH</h1>
    </div>
    <div class="content">
      <h2>🎉 Willkommen als Premium-Handwerker!</h2>
      <p>Hallo ${data.handwerkerName},</p>
      <p>Vielen Dank für Ihr Upgrade! Ihr Abonnement wurde erfolgreich aktiviert.</p>
      
      <div class="success-box">
        <h3 style="margin-top: 0; color: #065f46;">Abonnement aktiviert</h3>
        <p><strong>Plan:</strong> ${data.planName}</p>
        <p><strong>Betrag:</strong> ${data.amount}</p>
        <p><strong>Gültig bis:</strong> ${data.periodEnd}</p>
      </div>

      <div class="info-box">
        <h3 style="margin-top: 0; color: #0066CC;">Ihre Vorteile</h3>
        <ul class="feature-list">
          <li>Unbegrenzte Offerten pro Monat</li>
          <li>Bevorzugte Platzierung in Suchergebnissen</li>
          <li>Erweiterte Profilstatistiken</li>
          <li>Prioritäts-Support</li>
        </ul>
      </div>

      <p style="text-align: center;">
        <a href="https://bueeze.ch/handwerker-dashboard" class="button">Zum Dashboard</a>
      </p>

      <p style="font-size: 14px; color: #666;">
        Sie können Ihr Abonnement jederzeit in Ihrem Dashboard verwalten. Bei Fragen stehen wir Ihnen gerne zur Verfügung.
      </p>
    </div>
    <div class="footer">
      <p><strong>Büeze.ch GmbH</strong><br>
      Industriestrasse 28 | 9487 Gamprin-Bendern | Liechtenstein</p>
      <p><a href="https://bueeze.ch">www.bueeze.ch</a> | <a href="mailto:info@bueeze.ch">info@bueeze.ch</a></p>
      <p style="margin-top: 15px; color: #999;">
        Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht direkt auf diese Nachricht.
      </p>
    </div>
  </div>
</body>
</html>
`;

const planNames: Record<string, string> = {
  'monthly': 'Monatlich',
  '6_month': '6 Monate',
  'yearly': 'Jährlich',
  'annual': 'Jährlich',
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, planType, periodEnd, amount } = await req.json();

    if (!userId || !planType) {
      throw new Error("userId and planType are required");
    }

    console.log(`[send-subscription-confirmation] Processing for user: ${userId}, plan: ${planType}`);

    const smtp2goApiKey = Deno.env.get("SMTP2GO_API_KEY");
    if (!smtp2goApiKey) {
      throw new Error("SMTP2GO_API_KEY not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get handwerker profile
    const { data: hwProfile } = await supabase
      .from('handwerker_profiles')
      .select('first_name, last_name, company_name')
      .eq('user_id', userId)
      .single();

    // Get email from profiles table
    const { data: emailProfile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    if (!emailProfile?.email) {
      console.log('[send-subscription-confirmation] No email found, skipping notification');
      return new Response(
        JSON.stringify({ success: true, message: 'No email to send' }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const handwerkerName = hwProfile?.company_name ||
      `${hwProfile?.first_name || ''} ${hwProfile?.last_name || ''}`.trim() ||
      emailProfile.full_name || 'Handwerker';

    const planName = planNames[planType] || planType;
    const formattedPeriodEnd = periodEnd 
      ? new Date(periodEnd).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : 'Unbegrenzt';
    const formattedAmount = amount ? `CHF ${(amount / 100).toFixed(2)}` : 'Gemäss Ihrem Plan';

    console.log(`[send-subscription-confirmation] Sending confirmation to ${emailProfile.email}`);

    const emailHtml = subscriptionConfirmationTemplate({
      handwerkerName,
      planName,
      planType,
      periodEnd: formattedPeriodEnd,
      amount: formattedAmount,
    });

    const emailResponse = await fetch('https://api.smtp2go.com/v3/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Smtp2go-Api-Key': smtp2goApiKey,
      },
      body: JSON.stringify({
        sender: 'noreply@bueeze.ch',
        to: [emailProfile.email],
        subject: `🎉 Ihr ${planName}-Abonnement ist aktiv - Büeze.ch`,
        html_body: emailHtml,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("[send-subscription-confirmation] Email sending failed:", emailData);
      throw new Error(`Email sending failed: ${JSON.stringify(emailData)}`);
    }

    console.log("[send-subscription-confirmation] Confirmation email sent successfully");

    return new Response(
      JSON.stringify({ success: true, message: 'Subscription confirmation sent' }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[send-subscription-confirmation] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
