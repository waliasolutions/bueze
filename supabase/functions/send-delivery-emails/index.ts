import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { handleCorsPreflightRequest, successResponse, errorResponse } from '../_shared/cors.ts';
import { createSupabaseAdmin } from '../_shared/supabaseClient.ts';
import { sendEmail } from '../_shared/smtp2go.ts';
import { fetchClientProfile, fetchHandwerkerProfile, createMagicToken } from '../_shared/profileHelpers.ts';
import { deliveryConfirmationHandwerkerTemplate, deliveryReviewInvitationTemplate } from '../_shared/emailTemplates.ts';
import { FRONTEND_URL } from '../_shared/siteConfig.ts';

serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  try {
    const { leadId } = await req.json();

    if (!leadId) {
      throw new Error('Missing required field: leadId');
    }

    console.log(`[send-delivery-emails] Processing delivery for lead: ${leadId}`);

    const supabase = createSupabaseAdmin();

    // Fetch lead with accepted proposal details
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select(`
        id, title, owner_id, delivered_at, delivered_by,
        accepted_proposal_id,
        lead_proposals!leads_accepted_proposal_id_fkey (
          id, handwerker_id
        )
      `)
      .eq('id', leadId)
      .eq('status', 'completed')
      .not('delivered_at', 'is', null)
      .single();

    if (leadError || !lead) {
      throw new Error(`Delivered lead not found: ${leadError?.message || 'no data'}`);
    }

    const proposal = lead.lead_proposals as { id: string; handwerker_id: string } | null;
    if (!proposal) {
      throw new Error('No accepted proposal found for this lead');
    }

    // Fetch both profiles in parallel
    const [clientProfile, handwerkerProfile] = await Promise.all([
      fetchClientProfile(supabase, lead.owner_id),
      fetchHandwerkerProfile(supabase, proposal.handwerker_id),
    ]);

    if (!clientProfile?.email && !handwerkerProfile?.email) {
      console.warn('[send-delivery-emails] No email addresses found, skipping');
      return successResponse({ success: true, handwerkerEmailSent: false, clientEmailSent: false });
    }

    let handwerkerEmailSent = false;
    let clientEmailSent = false;

    // 1. Send confirmation email to handwerker
    if (handwerkerProfile?.email) {
      const emailHtml = deliveryConfirmationHandwerkerTemplate({
        handwerkerName: handwerkerProfile.fullName,
        projectTitle: lead.title || 'Ihr Projekt',
        clientName: clientProfile?.fullName || 'Kunde',
        dashboardLink: `${FRONTEND_URL}/handwerker-dashboard`,
      });

      const result = await sendEmail({
        to: handwerkerProfile.email,
        subject: `Auftrag erledigt: ${lead.title || 'Ihr Projekt'}`,
        htmlBody: emailHtml,
      });

      handwerkerEmailSent = result.success;
      if (!result.success) {
        console.error('[send-delivery-emails] Handwerker email failed:', result.error);
      }
    }

    // 2. Send review invitation email to client with magic link
    if (clientProfile?.email) {
      const magicTokenResult = await createMagicToken(supabase, {
        userId: lead.owner_id,
        resourceType: 'dashboard',
        resourceId: lead.id,
        expiryDays: 30,
        metadata: {
          lead_id: lead.id,
          handwerker_id: proposal.handwerker_id,
          purpose: 'delivery_review',
        },
      });

      const ratingLink = magicTokenResult
        ? `${FRONTEND_URL}/dashboard?rating=${lead.id}&token=${magicTokenResult.token}`
        : `${FRONTEND_URL}/dashboard`;

      const emailHtml = deliveryReviewInvitationTemplate({
        clientName: clientProfile.fullName || 'Kunde',
        handwerkerName: handwerkerProfile?.fullName || handwerkerProfile?.companyName || 'Ihr Handwerker',
        projectTitle: lead.title || 'Ihr Projekt',
        ratingLink,
      });

      const result = await sendEmail({
        to: clientProfile.email,
        subject: `Projekt abgeschlossen: Bewerten Sie ${handwerkerProfile?.fullName || 'Ihren Handwerker'}`,
        htmlBody: emailHtml,
      });

      clientEmailSent = result.success;
      if (!result.success) {
        console.error('[send-delivery-emails] Client email failed:', result.error);
      }
    }

    console.log(`[send-delivery-emails] Complete: handwerker=${handwerkerEmailSent}, client=${clientEmailSent}`);

    return successResponse({
      success: true,
      handwerkerEmailSent,
      clientEmailSent,
    });
  } catch (error) {
    console.error('[send-delivery-emails] Error:', error);
    return errorResponse(error);
  }
});
