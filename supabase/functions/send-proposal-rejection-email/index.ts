import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const resend = new Resend(Deno.env.get("SMTP2GO_API_KEY"));

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
      <p><strong>Büeze GmbH</strong><br>
      Gotthardstrasse 37 | 6410 Goldau | Schweiz</p>
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

    // Create Supabase admin client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Sending rejection email for proposal ${proposalId}`);

    // Get proposal details with lead and handwerker info
    const { data: proposal, error: proposalError } = await supabase
      .from('lead_proposals')
      .select('*, leads!lead_proposals_lead_id_fkey(title, city)')
      .eq('id', proposalId)
      .single();

    if (proposalError || !proposal) {
      throw new Error(`Proposal not found: ${proposalError?.message}`);
    }

    // Get handwerker profile
    const { data: hwProfile } = await supabase
      .from('handwerker_profiles')
      .select('first_name, email')
      .eq('user_id', proposal.handwerker_id)
      .single();

    if (!hwProfile?.email) {
      console.log('No handwerker email found, skipping notification');
      return new Response(
        JSON.stringify({ success: true, message: 'No email to send' }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send rejection email to handwerker
    const emailHtml = proposalRejectedTemplate({
      handwerkerName: hwProfile.first_name || 'Handwerker',
      projectTitle: proposal.leads?.title || 'Projekt',
      clientCity: proposal.leads?.city || 'Schweiz',
    });

    const emailResponse = await resend.emails.send({
      from: "Büeze.ch <noreply@bueeze.ch>",
      to: [hwProfile.email],
      subject: `Offerte nicht ausgewählt - ${proposal.leads?.title}`,
      html: emailHtml,
    });

    console.log("Rejection email sent:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailResponse }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error sending rejection email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
