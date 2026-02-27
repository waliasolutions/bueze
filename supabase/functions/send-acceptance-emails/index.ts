import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCorsPreflightRequest, successResponse, errorResponse } from '../_shared/cors.ts';
import { createSupabaseAdmin } from '../_shared/supabaseClient.ts';
import { sendEmail } from '../_shared/smtp2go.ts';
import { fetchClientProfile, fetchHandwerkerProfile } from '../_shared/profileHelpers.ts';
import { proposalAcceptedHandwerkerTemplate, proposalAcceptedClientTemplate } from '../_shared/emailTemplates.ts';
import { FRONTEND_URL } from '../_shared/siteConfig.ts';

serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  try {
    const { proposalId } = await req.json();
    
    if (!proposalId) {
      throw new Error('Missing required field: proposalId');
    }

    console.log('Processing acceptance emails for proposal:', proposalId);

    const supabase = createSupabaseAdmin();

    // Fetch proposal with lead
    const { data: proposal, error: proposalError } = await supabase
      .from('lead_proposals')
      .select(`
        *,
        leads(id, title, owner_id, address, city, zip, canton)
      `)
      .eq('id', proposalId)
      .single();

    if (proposalError || !proposal) {
      console.error('Proposal fetch error:', proposalError);
      throw new Error(`Proposal not found: ${proposalError?.message}`);
    }

    console.log('Proposal fetched:', { 
      proposalId, 
      leadId: proposal.lead_id,
      handwerkerId: proposal.handwerker_id,
      ownerId: proposal.leads?.owner_id 
    });

    // Fetch profiles using shared helpers
    const clientProfile = await fetchClientProfile(supabase, proposal.leads?.owner_id);
    const handwerkerProfile = await fetchHandwerkerProfile(supabase, proposal.handwerker_id);

    console.log('Profiles fetched:', { 
      clientEmail: clientProfile?.email, 
      handwerkerEmail: handwerkerProfile?.email 
    });

    // Create conversation thread
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .insert({
        lead_id: proposal.lead_id,
        homeowner_id: proposal.leads?.owner_id,
        handwerker_id: proposal.handwerker_id,
      })
      .select()
      .single();

    if (conversationError) {
      console.error('Failed to create conversation:', conversationError);
    } else {
      console.log('Conversation created:', conversation?.id);
    }

    // Insert in-app notification for handwerker
    const { error: notifError } = await supabase.from('handwerker_notifications').insert({
      user_id: proposal.handwerker_id,
      type: 'proposal_accepted',
      title: 'Offerte angenommen!',
      message: `${clientProfile?.fullName || 'Ein Kunde'} hat Ihre Offerte für "${proposal.leads?.title || 'Projekt'}" angenommen`,
      related_id: proposalId,
      metadata: { 
        lead_id: proposal.lead_id,
        conversation_id: conversation?.id
      }
    });

    if (notifError) {
      console.error('[send-acceptance-emails] Failed to create in-app notification:', notifError);
    } else {
      console.log('[send-acceptance-emails] Handwerker in-app notification created');
    }

    const conversationLink = conversation 
      ? `${FRONTEND_URL}/messages/${conversation.id}` 
      : `${FRONTEND_URL}/messages`;

    // Prepare email data
    const priceText = proposal.price_min && proposal.price_max
      ? `CHF ${proposal.price_min.toLocaleString()} - ${proposal.price_max.toLocaleString()}`
      : 'Nach Vereinbarung';

    const clientAddress = proposal.leads?.address 
      ? `${proposal.leads.address}, ${proposal.leads.zip} ${proposal.leads.city}`
      : `${proposal.leads?.zip || ''} ${proposal.leads?.city || ''}`.trim() || 'Nicht angegeben';

    const emailResults = { handwerkerSent: false, clientSent: false };

    // Send email to handwerker
    if (handwerkerProfile?.email) {
      const handwerkerEmailHtml = proposalAcceptedHandwerkerTemplate({
        projectTitle: proposal.leads?.title || 'Projekt',
        clientName: clientProfile?.fullName || 'Kunde',
        clientPhone: clientProfile?.phone || 'Nicht angegeben',
        clientEmail: clientProfile?.email || '',
        clientAddress,
        conversationLink,
        handwerkerName: handwerkerProfile.fullName,
      });

      console.log('Sending acceptance email to handwerker:', handwerkerProfile.email);
      const result = await sendEmail({
        to: handwerkerProfile.email,
        subject: 'Gratulation! Ihre Offerte wurde angenommen',
        htmlBody: handwerkerEmailHtml,
      });
      emailResults.handwerkerSent = result.success;
    }

    // Send email to client
    if (clientProfile?.email) {
      const clientEmailHtml = proposalAcceptedClientTemplate({
        projectTitle: proposal.leads?.title || 'Projekt',
        handwerkerCompany: handwerkerProfile?.companyName || 'Handwerksbetrieb',
        handwerkerName: handwerkerProfile?.fullName || 'Handwerker',
        handwerkerPhone: handwerkerProfile?.phone || 'Nicht angegeben',
        handwerkerEmail: handwerkerProfile?.email || '',
        handwerkerWebsite: handwerkerProfile?.website || undefined,
        proposalPrice: priceText,
        proposalTimeframe: proposal.estimated_duration_days 
          ? `${proposal.estimated_duration_days} Tage` 
          : 'Nach Absprache',
        conversationLink,
        clientName: clientProfile.fullName || 'Kunde',
      });

      console.log('Sending acceptance email to client:', clientProfile.email);
      const result = await sendEmail({
        to: clientProfile.email,
        subject: `Sie haben ${handwerkerProfile?.fullName || 'einen Handwerker'} ausgewählt`,
        htmlBody: clientEmailHtml,
      });
      emailResults.clientSent = result.success;
    }

    console.log('Acceptance emails completed:', {
      proposalId,
      handwerkerEmailSent: emailResults.handwerkerSent,
      clientEmailSent: emailResults.clientSent,
    });

    return successResponse({ 
      success: true, 
      message: 'Acceptance emails processed',
      handwerkerEmailSent: emailResults.handwerkerSent,
      clientEmailSent: emailResults.clientSent,
    });
  } catch (error) {
    console.error('Error in send-acceptance-emails:', error);
    return errorResponse(error);
  }
});
