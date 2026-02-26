import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { handleCorsPreflightRequest, successResponse, errorResponse } from '../_shared/cors.ts';
import { createSupabaseAdmin } from '../_shared/supabaseClient.ts';
import { sendEmail } from '../_shared/smtp2go.ts';
import { proposalRejectionTemplate } from '../_shared/emailTemplates.ts';

serve(async (req: Request) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  try {
    const { proposalId }: { proposalId: string } = await req.json();

    if (!proposalId) {
      throw new Error("proposalId is required");
    }

    console.log(`[send-proposal-rejection-email] Processing proposal: ${proposalId}`);

    const supabase = createSupabaseAdmin();

    // Step 1: Get proposal details with lead
    const { data: proposal, error: proposalError } = await supabase
      .from('lead_proposals')
      .select('*, leads(title, city, owner_id)')
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
      return successResponse({ success: true, message: 'No email to send' });
    }

    const handwerkerName = hwProfile?.company_name ||
      `${hwProfile?.first_name || ''} ${hwProfile?.last_name || ''}`.trim() ||
      'Handwerker';

    // Get client first name for the template
    const { data: ownerProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', proposal.leads?.owner_id || '')
      .maybeSingle();

    const clientFirstName = ownerProfile?.full_name?.split(' ')[0] || 'dem Kunden';

    console.log(`[send-proposal-rejection-email] Sending rejection email to ${hwEmailProfile.email}`);

    const emailHtml = proposalRejectionTemplate({
      handwerkerName,
      projectTitle: proposal.leads?.title || 'Projekt',
      clientFirstName,
    });

    const result = await sendEmail({
      to: hwEmailProfile.email,
      subject: `Offerte nicht ausgewählt - ${proposal.leads?.title || 'Projekt'}`,
      htmlBody: emailHtml,
    });

    if (!result.success) {
      throw new Error(result.error || 'Email sending failed');
    }

    console.log("[send-proposal-rejection-email] Rejection email sent successfully");

    return successResponse({ success: true, message: 'Rejection email sent' });
  } catch (error: any) {
    console.error("[send-proposal-rejection-email] Error:", error);
    return errorResponse(error.message, 500);
  }
});
