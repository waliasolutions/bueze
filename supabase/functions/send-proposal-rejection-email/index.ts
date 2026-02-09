import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Email template for rejected proposal notification to handwerker
const proposalRejectedTemplate = (data: {
  handwerkerName: string;
  projectTitle: string;
  clientCity: string;
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
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>BÜEZE.CH</h1>
    </div>
    <div class="content">
      <h2>Offerte nicht ausgewählt</h2>
      <p>Hallo ${data.handwerkerName},</p>
      <p>Leider wurde Ihre Offerte für das Projekt <strong>"${data.projectTitle}"</strong> in ${data.clientCity} nicht ausgewählt.</p>
      
      <div class="info-box">
        <p>Der Kunde hat sich für einen anderen Handwerker entschieden. Das ist völlig normal – nicht jede Offerte führt zum Auftrag.</p>
      </div>

      <p><strong>Bleiben Sie dran!</strong></p>
      <p>Auf Büeze.ch gibt es täglich neue Anfragen in Ihrer Region. Schauen Sie regelmässig vorbei und reichen Sie weitere Offerten ein.</p>

      <p style="text-align: center;">
        <a href="https://bueeze.ch/handwerker-dashboard" class="button">Neue Anfragen ansehen</a>
      </p>

      <p style="font-size: 14px; color: #666;">
        <strong>Tipp:</strong> Eine detaillierte und persönliche Offerte mit fairen Preisen erhöht Ihre Chancen, 
        vom Kunden ausgewählt zu werden.
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

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { proposalId }: { proposalId: string } = await req.json();

    if (!proposalId) {
      throw new Error("proposalId is required");
    }

    console.log(`[send-proposal-rejection-email] Processing proposal: ${proposalId}`);

    const smtp2goApiKey = Deno.env.get("SMTP2GO_API_KEY");
    if (!smtp2goApiKey) {
      throw new Error("SMTP2GO_API_KEY not configured");
    }

    // Create Supabase admin client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Get proposal details with lead
    const { data: proposal, error: proposalError } = await supabase
      .from('lead_proposals')
      .select('*, leads(title, city)')
      .eq('id', proposalId)
      .single();

    if (proposalError || !proposal) {
      throw new Error(`Proposal not found: ${proposalError?.message}`);
    }

    // Step 2: Get handwerker profile separately
    const { data: hwProfile } = await supabase
      .from('handwerker_profiles')
      .select('first_name, last_name, company_name')
      .eq('user_id', proposal.handwerker_id)
      .single();

    // Step 3: Get handwerker email from profiles table
    const { data: hwEmailProfile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', proposal.handwerker_id)
      .single();

    if (!hwEmailProfile?.email) {
      console.log('[send-proposal-rejection-email] No handwerker email found, skipping notification');
      return new Response(
        JSON.stringify({ success: true, message: 'No email to send' }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const handwerkerName = hwProfile?.company_name ||
      `${hwProfile?.first_name || ''} ${hwProfile?.last_name || ''}`.trim() ||
      'Handwerker';

    console.log(`[send-proposal-rejection-email] Sending rejection email to ${hwEmailProfile.email}`);

    // Send rejection email using SMTP2GO
    const emailHtml = proposalRejectedTemplate({
      handwerkerName,
      projectTitle: proposal.leads?.title || 'Projekt',
      clientCity: proposal.leads?.city || 'Schweiz',
    });

    const emailResponse = await fetch('https://api.smtp2go.com/v3/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Smtp2go-Api-Key': smtp2goApiKey,
      },
      body: JSON.stringify({
        sender: 'noreply@bueeze.ch',
        to: [hwEmailProfile.email],
        subject: `Offerte nicht ausgewählt - ${proposal.leads?.title}`,
        html_body: emailHtml,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("[send-proposal-rejection-email] Email sending failed:", emailData);
      throw new Error(`Email sending failed: ${JSON.stringify(emailData)}`);
    }

    console.log("[send-proposal-rejection-email] Rejection email sent successfully");

    return new Response(
      JSON.stringify({ success: true, message: 'Rejection email sent' }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[send-proposal-rejection-email] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
