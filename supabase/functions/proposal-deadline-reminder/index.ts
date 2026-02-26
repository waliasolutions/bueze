import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { handleCorsPreflightRequest, successResponse, errorResponse } from '../_shared/cors.ts';
import { createSupabaseAdmin } from '../_shared/supabaseClient.ts';
import { sendEmail } from '../_shared/smtp2go.ts';
import { proposalDeadlineClientTemplate, proposalDeadlineHandwerkerTemplate } from '../_shared/emailTemplates.ts';
import { formatSwissDateLong } from '../_shared/dateFormatter.ts';

serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  try {
    console.log('[proposal-deadline-reminder] Starting deadline reminder check...');

    const supabase = createSupabaseAdmin();

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
      const formattedDeadline = formatSwissDateLong(lead.proposal_deadline);

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
          const clientEmailHtml = proposalDeadlineClientTemplate({
            clientName: ownerProfile.full_name || 'Kunde',
            leadTitle: lead.title,
            proposalsCount: proposals.length,
            formattedDeadline,
            dashboardLink: 'https://bueeze.ch/dashboard'
          });

          console.log(`[proposal-deadline-reminder] Sending client reminder to ${ownerProfile.email}`);

          const result = await sendEmail({
            to: ownerProfile.email,
            subject: `Erinnerung: ${proposals.length} Offerten warten auf Ihre Antwort`,
            htmlBody: clientEmailHtml,
          });

          if (result.success) {
            clientEmailsSent++;
          } else {
            console.error(`[proposal-deadline-reminder] Client email failed:`, result.error);
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

            const handwerkerEmailHtml = proposalDeadlineHandwerkerTemplate({
              handwerkerName: profile.full_name || 'Handwerker',
              leadTitle: lead.title,
              formattedDeadline,
              magicLink,
              category: lead.category,
              city: lead.city,
              budgetMin: lead.budget_min,
              budgetMax: lead.budget_max
            });

            console.log(`[proposal-deadline-reminder] Sending handwerker reminder to ${profile.email}`);

            const result = await sendEmail({
              to: profile.email,
              subject: `Letzte Chance: Offerte für "${lead.title}" einreichen`,
              htmlBody: handwerkerEmailHtml,
            });

            if (result.success) {
              handwerkerEmailsSent++;
            } else {
              console.error(`[proposal-deadline-reminder] Handwerker email failed:`, result.error);
            }
          }
        }
      }
    }

    console.log(`[proposal-deadline-reminder] Complete: ${clientEmailsSent} clients, ${handwerkerEmailsSent} handwerkers`);

    return successResponse({
      success: true,
      message: 'Deadline reminders processed',
      clientEmailsSent,
      handwerkerEmailsSent,
      leadsProcessed: expiringLeads?.length || 0
    });

  } catch (error: any) {
    console.error('[proposal-deadline-reminder] Error:', error);

    // Create admin notification for function failure
    try {
      const supabase = createSupabaseAdmin();

      await supabase.from('admin_notifications').insert({
        type: 'scheduled_function_error',
        title: 'Proposal Deadline Reminder fehlgeschlagen',
        message: `Die geplante Funktion proposal-deadline-reminder ist fehlgeschlagen: ${error.message}`,
        metadata: {
          function_name: 'proposal-deadline-reminder',
          error_message: error.message,
          timestamp: new Date().toISOString(),
        }
      });
    } catch (notifError) {
      console.error('[proposal-deadline-reminder] Failed to create admin notification:', notifError);
    }

    return errorResponse(error.message, 500);
  }
});
