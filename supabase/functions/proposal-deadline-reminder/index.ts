import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const emailWrapper = (content: string) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #0066CC; color: white; padding: 20px; text-align: center;">
    <h1 style="margin: 0;">BÜEZE.CH</h1>
  </div>
  ${content}
  <div style="background: #f5f5f5; padding: 15px; text-align: center; margin-top: 30px; font-size: 12px; color: #666;">
    <p>© 2025 BÜEZE.CH - Ihr schweizer Handwerkerportal</p>
  </div>
</body>
</html>
`;

const clientReminderTemplate = (data: any) => {
  const deadlineDate = new Date(data.deadline);
  const formattedDeadline = deadlineDate.toLocaleDateString('de-CH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  return emailWrapper(`
    <div style="padding: 30px;">
      <h2>Hallo ${data.clientName}</h2>
      <p>Sie haben <strong>${data.proposalsCount} ${data.proposalsCount === 1 ? 'Offerte' : 'Offerten'}</strong> für Ihr Projekt erhalten:</p>
      
      <div style="background: #dbeafe; border-left: 4px solid #0066CC; padding: 15px; margin: 20px 0;">
        <h3 style="margin: 0 0 10px 0; color: #1e40af;">${data.leadTitle}</h3>
        <p style="margin: 0; color: #d97706; font-weight: bold;">⏰ Frist: ${formattedDeadline} (noch 2 Tage!)</p>
      </div>

      <p>Bitte überprüfen Sie die Offerten zeitnah in Ihrem Dashboard.</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.dashboardLink}" style="background: #0066CC; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Offerten ansehen
        </a>
      </div>
    </div>
  `);
};

const handwerkerReminderTemplate = (data: any) => {
  const deadlineDate = new Date(data.deadline);
  const formattedDeadline = deadlineDate.toLocaleDateString('de-CH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  return emailWrapper(`
    <div style="padding: 30px;">
      <h2>Letzte Chance, ${data.handwerkerName}!</h2>
      <p>Die Frist für diese Anfrage läuft bald ab:</p>
      
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin: 0 0 15px 0; color: #0066CC;">${data.leadTitle}</h3>
        <p style="margin: 5px 0;"><strong>Kategorie:</strong> ${data.category}</p>
        <p style="margin: 5px 0;"><strong>Ort:</strong> ${data.city}</p>
        <p style="margin: 5px 0;"><strong>Budget:</strong> CHF ${data.budgetMin?.toLocaleString()} - ${data.budgetMax?.toLocaleString()}</p>
      </div>

      <p style="color: #d97706; font-weight: bold;">⏰ Frist: ${formattedDeadline} (noch 2 Tage!)</p>

      <p>Sie haben sich diese Anfrage angesehen, aber noch keine Offerte eingereicht.</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.magicLink}" style="background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Jetzt Offerte einreichen
        </a>
      </div>
    </div>
  `);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[proposal-deadline-reminder] Starting deadline reminder check...');

    const smtp2goApiKey = Deno.env.get('SMTP2GO_API_KEY');
    if (!smtp2goApiKey) {
      throw new Error('SMTP2GO_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find leads expiring in 2 days
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
    twoDaysFromNow.setHours(23, 59, 59, 999);

    const twoDaysStart = new Date(twoDaysFromNow);
    twoDaysStart.setHours(0, 0, 0, 0);

    // Step 1: Fetch expiring leads (basic data only - no FK join)
    const { data: expiringLeads, error: leadsError } = await supabase
      .from('leads')
      .select(`
        id,
        title,
        category,
        city,
        description,
        budget_min,
        budget_max,
        proposal_deadline,
        proposals_count,
        owner_id
      `)
      .eq('status', 'active')
      .gte('proposal_deadline', twoDaysStart.toISOString())
      .lte('proposal_deadline', twoDaysFromNow.toISOString());

    if (leadsError) {
      console.error('[proposal-deadline-reminder] Error fetching expiring leads:', leadsError);
      throw leadsError;
    }

    console.log(`[proposal-deadline-reminder] Found ${expiringLeads?.length || 0} leads expiring in 2 days`);

    let clientEmailsSent = 0;
    let handwerkerEmailsSent = 0;

    for (const lead of expiringLeads || []) {
      // Step 2: Fetch owner profile separately
      const { data: ownerProfile, error: ownerError } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', lead.owner_id)
        .single();

      if (ownerError) {
        console.warn(`[proposal-deadline-reminder] Could not fetch owner profile for lead ${lead.id}: ${ownerError.message}`);
      }

      // Send reminder to client if they have proposals
      if (lead.proposals_count > 0 && ownerProfile?.email) {
        const { data: proposals } = await supabase
          .from('lead_proposals')
          .select('id, status')
          .eq('lead_id', lead.id)
          .eq('status', 'pending');

        if (proposals && proposals.length > 0) {
          const clientEmailHtml = clientReminderTemplate({
            clientName: ownerProfile.full_name || 'Kunde',
            leadTitle: lead.title,
            proposalsCount: proposals.length,
            deadline: lead.proposal_deadline,
            dashboardLink: 'https://bueeze.ch/dashboard'
          });

          console.log(`[proposal-deadline-reminder] Sending client reminder to ${ownerProfile.email}`);

          const emailResponse = await fetch('https://api.smtp2go.com/v3/email/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Smtp2go-Api-Key': smtp2goApiKey,
            },
            body: JSON.stringify({
              sender: 'noreply@bueeze.ch',
              to: [ownerProfile.email],
              subject: `Erinnerung: ${proposals.length} Offerten warten auf Ihre Antwort`,
              html_body: clientEmailHtml,
            }),
          });

          if (emailResponse.ok) {
            clientEmailsSent++;
          } else {
            const errorData = await emailResponse.json();
            console.error(`[proposal-deadline-reminder] Client email failed:`, errorData);
          }
        }
      }

      // Find handwerkers who viewed but didn't submit proposal
      const { data: views } = await supabase
        .from('lead_views')
        .select('viewer_id')
        .eq('lead_id', lead.id);

      const viewerIds = views?.map(v => v.viewer_id) || [];

      if (viewerIds.length > 0) {
        const { data: existingProposals } = await supabase
          .from('lead_proposals')
          .select('handwerker_id')
          .eq('lead_id', lead.id)
          .in('handwerker_id', viewerIds);

        const proposedIds = new Set(existingProposals?.map(p => p.handwerker_id) || []);
        const nonProposedViewers = viewerIds.filter(id => !proposedIds.has(id));

        for (const handwerkerId of nonProposedViewers) {
          // Fetch handwerker profile separately
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', handwerkerId)
            .single();

          if (profile?.email) {
            const token = crypto.randomUUID().replace(/-/g, '');
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);

            await supabase.from('magic_tokens').insert({
              token,
              user_id: handwerkerId,
              resource_type: 'lead',
              resource_id: lead.id,
              expires_at: expiresAt.toISOString(),
            });

            const magicLink = `https://bueeze.ch/opportunity/${lead.id}?token=${token}`;

            const handwerkerEmailHtml = handwerkerReminderTemplate({
              handwerkerName: profile.full_name || 'Handwerker',
              leadTitle: lead.title,
              deadline: lead.proposal_deadline,
              magicLink,
              category: lead.category,
              city: lead.city,
              budgetMin: lead.budget_min,
              budgetMax: lead.budget_max
            });

            console.log(`[proposal-deadline-reminder] Sending handwerker reminder to ${profile.email}`);

            const emailResponse = await fetch('https://api.smtp2go.com/v3/email/send', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Smtp2go-Api-Key': smtp2goApiKey,
              },
              body: JSON.stringify({
                sender: 'noreply@bueeze.ch',
                to: [profile.email],
                subject: `Letzte Chance: Offerte für "${lead.title}" einreichen`,
                html_body: handwerkerEmailHtml,
              }),
            });

            if (emailResponse.ok) {
              handwerkerEmailsSent++;
            } else {
              const errorData = await emailResponse.json();
              console.error(`[proposal-deadline-reminder] Handwerker email failed:`, errorData);
            }
          }
        }
      }
    }

    console.log(`[proposal-deadline-reminder] Complete: ${clientEmailsSent} clients, ${handwerkerEmailsSent} handwerkers`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Deadline reminders processed',
        clientEmailsSent,
        handwerkerEmailsSent,
        leadsProcessed: expiringLeads?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('[proposal-deadline-reminder] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
