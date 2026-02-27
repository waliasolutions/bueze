import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { handleCorsPreflightRequest, successResponse, errorResponse } from '../_shared/cors.ts';
import { createSupabaseAdmin } from '../_shared/supabaseClient.ts';
import { sendEmail } from '../_shared/smtp2go.ts';
import { ratingReminderTemplate } from '../_shared/emailTemplates.ts';
import { FRONTEND_URL } from '../_shared/siteConfig.ts';

serve(async (req: Request) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  try {
    const supabase = createSupabaseAdmin();

    console.log("[send-rating-reminder] Starting rating reminder check...");

    // Find leads delivered 7-8 days ago (handwerker confirmed delivery)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const eightDaysAgo = new Date();
    eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

    // Get delivered leads from 7-8 days ago with their accepted proposals
    const { data: deliveredLeads, error: leadsError } = await supabase
      .from('leads')
      .select(`
        id,
        title,
        owner_id,
        delivered_at,
        accepted_proposal_id,
        lead_proposals!leads_accepted_proposal_id_fkey (
          id,
          handwerker_id
        )
      `)
      .eq('status', 'completed')
      .not('delivered_at', 'is', null)
      .not('accepted_proposal_id', 'is', null)
      .gte('delivered_at', eightDaysAgo.toISOString())
      .lt('delivered_at', sevenDaysAgo.toISOString());

    if (leadsError) {
      console.error("[send-rating-reminder] Error fetching delivered leads:", leadsError);
      throw leadsError;
    }

    console.log(`[send-rating-reminder] Found ${deliveredLeads?.length || 0} delivered leads to check`);

    if (!deliveredLeads || deliveredLeads.length === 0) {
      return successResponse({ success: true, emailsSent: 0, skipped: 0, message: 'No delivered leads to process' });
    }

    // Batch check for existing reviews
    const leadIds = deliveredLeads.map(l => l.id);
    const { data: existingReviews } = await supabase
      .from('reviews')
      .select('lead_id')
      .in('lead_id', leadIds);

    const reviewedLeadIds = new Set(existingReviews?.map(r => r.lead_id) || []);

    // Filter to unreviewed leads
    const unreviewedLeads = deliveredLeads.filter(l => !reviewedLeadIds.has(l.id));
    console.log(`[send-rating-reminder] ${unreviewedLeads.length} leads need rating reminders`);

    if (unreviewedLeads.length === 0) {
      return successResponse({ success: true, emailsSent: 0, skipped: leadIds.length, message: 'All leads already reviewed' });
    }

    // Batch fetch client profiles
    const ownerIds = [...new Set(unreviewedLeads.map(l => l.owner_id))];
    const { data: clientProfiles } = await supabase
      .from('profiles')
      .select('id, full_name, first_name, email')
      .in('id', ownerIds);
    const clientMap = new Map((clientProfiles || []).map(p => [p.id, p]));

    // Batch fetch handwerker profiles
    const handwerkerIds = [...new Set(
      unreviewedLeads
        .map(l => (l.lead_proposals as { handwerker_id: string } | null)?.handwerker_id)
        .filter((id): id is string => !!id)
    )];
    const { data: hwProfiles } = await supabase
      .from('handwerker_profiles')
      .select('user_id, first_name, last_name, company_name')
      .in('user_id', handwerkerIds);
    const hwMap = new Map((hwProfiles || []).map(p => [p.user_id, p]));

    // Batch create magic tokens
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 30);
    const tokenRecords = unreviewedLeads.map(lead => {
      const proposal = lead.lead_proposals as { id: string; handwerker_id: string } | null;
      return {
        token: crypto.randomUUID(),
        resource_type: 'rating',
        resource_id: lead.id,
        user_id: lead.owner_id,
        expires_at: tokenExpiresAt.toISOString(),
        metadata: {
          lead_id: lead.id,
          handwerker_id: proposal?.handwerker_id,
          proposal_id: proposal?.id,
        },
      };
    });

    if (tokenRecords.length > 0) {
      const { error: tokenError } = await supabase.from('magic_tokens').insert(tokenRecords);
      if (tokenError) console.error('[send-rating-reminder] Batch token insert error:', tokenError.message);
    }
    const tokenMap = new Map(tokenRecords.map(t => [t.resource_id, t.token]));

    let emailsSent = 0;
    let skipped = reviewedLeadIds.size;

    for (const lead of unreviewedLeads) {
      const client = clientMap.get(lead.owner_id);
      if (!client?.email) { skipped++; continue; }

      const proposal = lead.lead_proposals as { handwerker_id: string } | null;
      const hw = proposal ? hwMap.get(proposal.handwerker_id) : null;
      const handwerkerName = hw?.company_name ||
        `${hw?.first_name || ''} ${hw?.last_name || ''}`.trim() ||
        'Ihren Handwerker';

      const token = tokenMap.get(lead.id);
      const ratingLink = `${FRONTEND_URL}/dashboard?rating=${lead.id}${token ? `&token=${token}` : ''}`;

      const emailHtml = ratingReminderTemplate({
        clientName: client.first_name || client.full_name || 'Kunde',
        projectTitle: lead.title || 'Ihr Projekt',
        handwerkerName,
        ratingLink,
      });

      try {
        const emailResult = await sendEmail({
          to: client.email,
          subject: `⭐ Wie war ${handwerkerName}? Ihre Bewertung zählt!`,
          htmlBody: emailHtml,
        });

        if (emailResult.success) {
          emailsSent++;
        } else {
          console.error(`[send-rating-reminder] Email failed for ${client.email}:`, emailResult.error);
        }
      } catch (emailError) {
        console.error(`[send-rating-reminder] Email error for ${client.email}:`, emailError);
      }
    }

    console.log(`[send-rating-reminder] Complete: ${emailsSent} emails sent, ${skipped} skipped`);

    return successResponse({
      success: true,
      emailsSent,
      skipped,
      message: `Sent ${emailsSent} rating reminder emails`
    });
  } catch (error: any) {
    console.error("[send-rating-reminder] Error:", error);

    // Create admin notification for function failure
    try {
      const supabase = createSupabaseAdmin();

      await supabase.from('admin_notifications').insert({
        type: 'scheduled_function_error',
        title: 'Rating Reminder fehlgeschlagen',
        message: `Die geplante Funktion send-rating-reminder ist fehlgeschlagen: ${error.message}`,
        metadata: {
          function_name: 'send-rating-reminder',
          error_message: error.message,
          timestamp: new Date().toISOString(),
        }
      });
    } catch (notifError) {
      console.error("[send-rating-reminder] Failed to create admin notification:", notifError);
    }

    return errorResponse(error.message, 500);
  }
});
