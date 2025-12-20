import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCorsPreflightRequest, successResponse, errorResponse } from '../_shared/cors.ts';
import { createSupabaseAdmin } from '../_shared/supabaseClient.ts';
import { sendEmail } from '../_shared/smtp2go.ts';
import { fetchClientProfile, fetchHandwerkerProfile, fetchHandwerkerRating, createMagicToken } from '../_shared/profileHelpers.ts';
import { newProposalNotificationTemplate } from '../_shared/emailTemplates.ts';

serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  try {
    const { proposalId } = await req.json();
    
    if (!proposalId) {
      throw new Error('Missing required field: proposalId');
    }

    console.log('Processing new proposal notification for:', proposalId);

    const supabase = createSupabaseAdmin();

    // Fetch proposal with lead
    const { data: proposal, error: proposalError } = await supabase
      .from('lead_proposals')
      .select(`
        *,
        leads(id, title, owner_id)
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
      handwerkerName: handwerkerProfile?.fullName 
    });

    if (!clientProfile?.email) {
      console.error('Client email is missing - cannot send proposal notification');
      throw new Error('Client email not found');
    }

    // Create magic token for client
    const tokenResult = await createMagicToken(supabase, {
      userId: proposal.leads?.owner_id,
      resourceType: 'proposal',
      resourceId: proposalId,
      expiryDays: 30,
    });

    const magicLink = tokenResult?.magicLink || `https://bueeze.ch/proposals/${proposalId}`;

    // Fetch handwerker rating stats
    const ratingStats = await fetchHandwerkerRating(supabase, proposal.handwerker_id);

    // Send email to client
    const emailHtml = newProposalNotificationTemplate({
      projectTitle: proposal.leads?.title || 'Ihr Projekt',
      handwerkerFirstName: handwerkerProfile?.firstName || handwerkerProfile?.companyName || 'Ein Handwerker',
      handwerkerCity: handwerkerProfile?.businessCity || 'Region',
      priceMin: proposal.price_min,
      priceMax: proposal.price_max,
      rating: ratingStats.averageRating || undefined,
      magicLink,
      clientName: clientProfile.fullName || 'Kunde',
    });

    console.log('Sending proposal notification email to:', clientProfile.email);

    const result = await sendEmail({
      to: clientProfile.email,
      subject: `Neue Offerte für Ihr Projekt "${proposal.leads?.title}"`,
      htmlBody: emailHtml,
    });

    if (!result.success) {
      throw new Error(result.error || 'Email sending failed');
    }

    // Insert in-app notification for client
    const handwerkerName = handwerkerProfile?.companyName || handwerkerProfile?.fullName || 'Ein Handwerker';
    await supabase.from('client_notifications').insert({
      user_id: proposal.leads?.owner_id,
      type: 'new_proposal',
      title: 'Neue Offerte erhalten',
      message: `${handwerkerName} hat eine Offerte für "${proposal.leads?.title}" eingereicht`,
      related_id: proposalId,
      metadata: { lead_id: proposal.leads?.id }
    });

    console.log('Proposal notification sent successfully:', { 
      proposalId, 
      clientEmail: clientProfile.email 
    });

    return successResponse({ 
      success: true, 
      message: 'Proposal notification sent successfully',
    });
  } catch (error) {
    console.error('Error in send-proposal-notification:', error);
    return errorResponse(error);
  }
});
