import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { proposalAcceptedHandwerkerTemplate, proposalAcceptedClientTemplate } from '../_shared/emailTemplates.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { proposalId } = await req.json();
    
    if (!proposalId) {
      throw new Error('Missing required field: proposalId');
    }

    const smtp2goApiKey = Deno.env.get('SMTP2GO_API_KEY');
    if (!smtp2goApiKey) {
      throw new Error('SMTP2GO_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch full proposal details with all contact information
    const { data: proposal, error: proposalError } = await supabase
      .from('lead_proposals')
      .select(`
        *,
        leads!lead_proposals_lead_id_fkey(
          id,
          title,
          user_id,
          address,
          profiles!leads_user_id_fkey(email, full_name, phone)
        ),
        handwerker_profiles!lead_proposals_handwerker_id_fkey(
          user_id,
          company_name,
          website,
          profiles!handwerker_profiles_user_id_fkey(email, full_name, phone)
        )
      `)
      .eq('id', proposalId)
      .single();

    if (proposalError || !proposal) {
      throw new Error(`Proposal not found: ${proposalError?.message}`);
    }

    // Create conversation thread
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .insert({
        lead_id: proposal.lead_id,
        client_id: proposal.leads?.user_id,
        handwerker_id: proposal.handwerker_profiles?.user_id,
      })
      .select()
      .single();

    if (conversationError) {
      console.error('Failed to create conversation:', conversationError);
    }

    const conversationLink = conversation 
      ? `https://bueze.ch/messages/${conversation.id}` 
      : 'https://bueze.ch/messages';

    // Prepare email data
    const priceText = proposal.price_min && proposal.price_max
      ? `CHF ${proposal.price_min.toLocaleString()} - ${proposal.price_max.toLocaleString()}`
      : 'Nach Vereinbarung';

    // Email to Handwerker
    const handwerkerEmailHtml = proposalAcceptedHandwerkerTemplate({
      projectTitle: proposal.leads?.title || 'Projekt',
      clientName: proposal.leads?.profiles?.full_name || 'Kunde',
      clientPhone: proposal.leads?.profiles?.phone || 'Nicht angegeben',
      clientEmail: proposal.leads?.profiles?.email || '',
      clientAddress: proposal.leads?.address || 'Nicht angegeben',
      conversationLink,
      handwerkerName: proposal.handwerker_profiles?.profiles?.full_name || 'Handwerker',
    });

    // Email to Client
    const clientEmailHtml = proposalAcceptedClientTemplate({
      projectTitle: proposal.leads?.title || 'Projekt',
      handwerkerCompany: proposal.handwerker_profiles?.company_name || 'Handwerksbetrieb',
      handwerkerName: proposal.handwerker_profiles?.profiles?.full_name || 'Handwerker',
      handwerkerPhone: proposal.handwerker_profiles?.profiles?.phone || 'Nicht angegeben',
      handwerkerEmail: proposal.handwerker_profiles?.profiles?.email || '',
      handwerkerWebsite: proposal.handwerker_profiles?.website,
      proposalPrice: priceText,
      proposalTimeframe: proposal.estimated_duration || 'Nach Absprache',
      conversationLink,
      clientName: proposal.leads?.profiles?.full_name || 'Kunde',
    });

    // Send both emails
    const handwerkerEmailPromise = fetch('https://api.smtp2go.com/v3/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Smtp2go-Api-Key': smtp2goApiKey,
      },
      body: JSON.stringify({
        sender: 'noreply@bueze.ch',
        to: [proposal.handwerker_profiles?.profiles?.email],
        subject: 'Gratulation! Ihre Offerte wurde angenommen',
        html_body: handwerkerEmailHtml,
      }),
    });

    const clientEmailPromise = fetch('https://api.smtp2go.com/v3/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Smtp2go-Api-Key': smtp2goApiKey,
      },
      body: JSON.stringify({
        sender: 'noreply@bueze.ch',
        to: [proposal.leads?.profiles?.email],
        subject: `Sie haben ${proposal.handwerker_profiles?.profiles?.full_name || 'einen Handwerker'} ausgewählt`,
        html_body: clientEmailHtml,
      }),
    });

    const [handwerkerResponse, clientResponse] = await Promise.all([
      handwerkerEmailPromise,
      clientEmailPromise,
    ]);

    const handwerkerData = await handwerkerResponse.json();
    const clientData = await clientResponse.json();

    const errors = [];
    if (!handwerkerResponse.ok) {
      errors.push({ recipient: 'handwerker', error: handwerkerData });
    }
    if (!clientResponse.ok) {
      errors.push({ recipient: 'client', error: clientData });
    }

    if (errors.length > 0) {
      console.error('Some emails failed:', errors);
    }

    console.log('Acceptance emails sent:', {
      proposalId,
      handwerkerSuccess: handwerkerResponse.ok,
      clientSuccess: clientResponse.ok,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Acceptance emails sent',
        handwerkerEmailSent: handwerkerResponse.ok,
        clientEmailSent: clientResponse.ok,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in send-acceptance-emails:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
