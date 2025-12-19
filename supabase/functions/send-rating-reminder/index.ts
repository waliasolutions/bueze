import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rating reminder email template
const ratingReminderTemplate = (data: {
  clientName: string;
  projectTitle: string;
  handwerkerName: string;
  ratingLink: string;
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
    .stars {
      font-size: 24px;
      color: #FFD700;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>BÜEZE.CH</h1>
    </div>
    <div class="content">
      <h2>⭐ Wie war Ihre Erfahrung?</h2>
      <p>Hallo ${data.clientName},</p>
      <p>Vor einer Woche haben Sie <strong>${data.handwerkerName}</strong> für Ihr Projekt <strong>"${data.projectTitle}"</strong> ausgewählt.</p>
      
      <div class="info-box">
        <p>Ihre Bewertung hilft anderen Kunden, den richtigen Handwerker zu finden, und unterstützt qualitätsbewusste Fachleute.</p>
        <p class="stars">★★★★★</p>
      </div>

      <p style="text-align: center;">
        <a href="${data.ratingLink}" class="button">Jetzt bewerten</a>
      </p>

      <p style="font-size: 14px; color: #666;">
        Die Bewertung dauert nur 1-2 Minuten und ist anonym für andere Nutzer (nur Ihr Vorname wird angezeigt).
      </p>
    </div>
    <div class="footer">
      <p><strong>Büeze GmbH</strong><br>
      Gotthardstrasse 37 | 6410 Goldau | Schweiz</p>
      <p><a href="https://bueeze.ch">www.bueeze.ch</a> | <a href="mailto:info@bueeze.ch">info@bueeze.ch</a></p>
    </div>
  </div>
</body>
</html>
`;

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const smtp2goApiKey = Deno.env.get("SMTP2GO_API_KEY");
    
    if (!smtp2goApiKey) {
      throw new Error("SMTP2GO_API_KEY not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("[send-rating-reminder] Starting rating reminder check...");

    // Find accepted proposals from ~7 days ago that haven't been rated yet
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const eightDaysAgo = new Date();
    eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

    // Get proposals accepted between 7-8 days ago
    const { data: proposals, error: proposalsError } = await supabase
      .from('lead_proposals')
      .select(`
        id,
        lead_id,
        handwerker_id,
        responded_at,
        leads (
          id,
          title,
          owner_id
        )
      `)
      .eq('status', 'accepted')
      .gte('responded_at', eightDaysAgo.toISOString())
      .lt('responded_at', sevenDaysAgo.toISOString());

    if (proposalsError) {
      console.error("[send-rating-reminder] Error fetching proposals:", proposalsError);
      throw proposalsError;
    }

    console.log(`[send-rating-reminder] Found ${proposals?.length || 0} proposals to check for rating reminders`);

    let emailsSent = 0;
    let skipped = 0;

    for (const proposal of proposals || []) {
      const leadId = proposal.lead_id;
      
      // Check if a review already exists for this lead
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('lead_id', leadId)
        .maybeSingle();

      if (existingReview) {
        console.log(`[send-rating-reminder] Review already exists for lead ${leadId}, skipping`);
        skipped++;
        continue;
      }

      // Get client details separately (no FK join)
      const { data: clientProfile } = await supabase
        .from('profiles')
        .select('full_name, first_name, email')
        .eq('id', proposal.leads?.owner_id)
        .single();

      if (!clientProfile?.email) {
        console.log(`[send-rating-reminder] No email for client on lead ${leadId}, skipping`);
        skipped++;
        continue;
      }

      // Get handwerker details separately
      const { data: handwerkerProfile } = await supabase
        .from('handwerker_profiles')
        .select('first_name, last_name, company_name')
        .eq('user_id', proposal.handwerker_id)
        .single();

      const handwerkerName = handwerkerProfile?.company_name || 
        `${handwerkerProfile?.first_name || ''} ${handwerkerProfile?.last_name || ''}`.trim() ||
        'Ihren Handwerker';

      const clientName = clientProfile.first_name || clientProfile.full_name || 'Kunde';
      const projectTitle = proposal.leads?.title || 'Ihr Projekt';

      // Create magic token for rating link
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days to rate

      await supabase.from('magic_tokens').insert({
        token,
        resource_type: 'rating',
        resource_id: leadId,
        user_id: proposal.leads?.owner_id,
        expires_at: expiresAt.toISOString(),
        metadata: {
          lead_id: leadId,
          handwerker_id: proposal.handwerker_id,
          proposal_id: proposal.id
        }
      });

      const ratingLink = `https://bueeze.ch/dashboard?rating=${leadId}`;

      // Send email using SMTP2GO
      const emailHtml = ratingReminderTemplate({
        clientName,
        projectTitle,
        handwerkerName,
        ratingLink
      });

      try {
        console.log(`[send-rating-reminder] Sending reminder to ${clientProfile.email}`);

        const emailResponse = await fetch('https://api.smtp2go.com/v3/email/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Smtp2go-Api-Key': smtp2goApiKey,
          },
          body: JSON.stringify({
            sender: 'noreply@bueeze.ch',
            to: [clientProfile.email],
            subject: `⭐ Wie war ${handwerkerName}? Ihre Bewertung zählt!`,
            html_body: emailHtml,
          }),
        });

        if (emailResponse.ok) {
          console.log(`[send-rating-reminder] Rating reminder sent to ${clientProfile.email} for lead ${leadId}`);
          emailsSent++;
        } else {
          const errorData = await emailResponse.json();
          console.error(`[send-rating-reminder] Failed to send email to ${clientProfile.email}:`, errorData);
        }
      } catch (emailError) {
        console.error(`[send-rating-reminder] Failed to send email to ${clientProfile.email}:`, emailError);
      }
    }

    console.log(`[send-rating-reminder] Complete: ${emailsSent} emails sent, ${skipped} skipped`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailsSent,
        skipped,
        message: `Sent ${emailsSent} rating reminder emails` 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("[send-rating-reminder] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
