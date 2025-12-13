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

    console.log('Processing acceptance emails for proposal:', proposalId);

    const smtp2goApiKey = Deno.env.get('SMTP2GO_API_KEY');
    if (!smtp2goApiKey) {
      throw new Error('SMTP2GO_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Step 1: Fetch proposal with lead (no FK joins to profiles)
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

    // Step 2: Fetch client profile using owner_id
    const { data: clientProfile, error: clientError } = await supabase
      .from('profiles')
      .select('email, full_name, phone')
      .eq('id', proposal.leads?.owner_id)
      .single();

    if (clientError) {
      console.error('Client profile fetch error:', clientError);
    }

    console.log('Client profile fetched:', { 
      email: clientProfile?.email, 
      name: clientProfile?.full_name 
    });

    // Step 3: Fetch handwerker profile using handwerker_id
    const { data: handwerkerProfile, error: handwerkerError } = await supabase
      .from('handwerker_profiles')
      .select('user_id, company_name, website, first_name, last_name, email, phone_number, business_address, business_city, business_zip')
      .eq('user_id', proposal.handwerker_id)
      .single();

    if (handwerkerError) {
      console.error('Handwerker profile fetch error:', handwerkerError);
    }

    // Step 4: Fetch handwerker's auth profile for email if not in handwerker_profiles
    let handwerkerEmail = handwerkerProfile?.email;
    let handwerkerPhone = handwerkerProfile?.phone_number;
    
    if (!handwerkerEmail) {
      const { data: handwerkerAuthProfile } = await supabase
        .from('profiles')
        .select('email, full_name, phone')
        .eq('id', proposal.handwerker_id)
        .single();
      
      handwerkerEmail = handwerkerAuthProfile?.email;
      if (!handwerkerPhone) {
        handwerkerPhone = handwerkerAuthProfile?.phone;
      }
    }

    const handwerkerFullName = handwerkerProfile?.first_name && handwerkerProfile?.last_name
      ? `${handwerkerProfile.first_name} ${handwerkerProfile.last_name}`
      : handwerkerProfile?.company_name || 'Handwerker';

    console.log('Handwerker profile fetched:', { 
      email: handwerkerEmail, 
      name: handwerkerFullName,
      company: handwerkerProfile?.company_name 
    });

    // Validate emails before sending
    if (!clientProfile?.email) {
      console.error('Client email is missing - cannot send acceptance email to client');
    }
    if (!handwerkerEmail) {
      console.error('Handwerker email is missing - cannot send acceptance email to handwerker');
    }

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

    const conversationLink = conversation 
      ? `https://bueeze.ch/messages/${conversation.id}` 
      : 'https://bueeze.ch/messages';

    // Prepare email data
    const priceText = proposal.price_min && proposal.price_max
      ? `CHF ${proposal.price_min.toLocaleString()} - ${proposal.price_max.toLocaleString()}`
      : 'Nach Vereinbarung';

    const clientAddress = proposal.leads?.address 
      ? `${proposal.leads.address}, ${proposal.leads.zip} ${proposal.leads.city}`
      : `${proposal.leads?.zip || ''} ${proposal.leads?.city || ''}`.trim() || 'Nicht angegeben';

    // Email to Handwerker
    const handwerkerEmailHtml = proposalAcceptedHandwerkerTemplate({
      projectTitle: proposal.leads?.title || 'Projekt',
      clientName: clientProfile?.full_name || 'Kunde',
      clientPhone: clientProfile?.phone || 'Nicht angegeben',
      clientEmail: clientProfile?.email || '',
      clientAddress: clientAddress,
      conversationLink,
      handwerkerName: handwerkerFullName,
    });

    // Email to Client
    const clientEmailHtml = proposalAcceptedClientTemplate({
      projectTitle: proposal.leads?.title || 'Projekt',
      handwerkerCompany: handwerkerProfile?.company_name || 'Handwerksbetrieb',
      handwerkerName: handwerkerFullName,
      handwerkerPhone: handwerkerPhone || 'Nicht angegeben',
      handwerkerEmail: handwerkerEmail || '',
      handwerkerWebsite: handwerkerProfile?.website,
      proposalPrice: priceText,
      proposalTimeframe: proposal.estimated_duration_days 
        ? `${proposal.estimated_duration_days} Tage` 
        : 'Nach Absprache',
      conversationLink,
      clientName: clientProfile?.full_name || 'Kunde',
    });

    const emailPromises = [];
    const emailResults = { handwerkerSent: false, clientSent: false };

    // Send email to handwerker if email exists
    if (handwerkerEmail) {
      console.log('Sending acceptance email to handwerker:', handwerkerEmail);
      emailPromises.push(
        fetch('https://api.smtp2go.com/v3/email/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Smtp2go-Api-Key': smtp2goApiKey,
          },
          body: JSON.stringify({
            sender: 'noreply@bueeze.ch',
            to: [handwerkerEmail],
            subject: 'Gratulation! Ihre Offerte wurde angenommen',
            html_body: handwerkerEmailHtml,
          }),
        }).then(async (res) => {
          const data = await res.json();
          console.log('Handwerker email response:', { ok: res.ok, status: res.status, data });
          emailResults.handwerkerSent = res.ok;
          return { type: 'handwerker', ok: res.ok, data };
        })
      );
    }

    // Send email to client if email exists
    if (clientProfile?.email) {
      console.log('Sending acceptance email to client:', clientProfile.email);
      emailPromises.push(
        fetch('https://api.smtp2go.com/v3/email/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Smtp2go-Api-Key': smtp2goApiKey,
          },
          body: JSON.stringify({
            sender: 'noreply@bueeze.ch',
            to: [clientProfile.email],
            subject: `Sie haben ${handwerkerFullName} ausgewählt`,
            html_body: clientEmailHtml,
          }),
        }).then(async (res) => {
          const data = await res.json();
          console.log('Client email response:', { ok: res.ok, status: res.status, data });
          emailResults.clientSent = res.ok;
          return { type: 'client', ok: res.ok, data };
        })
      );
    }

    const results = await Promise.all(emailPromises);
    const errors = results.filter(r => !r.ok);

    console.log('Acceptance emails completed:', {
      proposalId,
      handwerkerEmailSent: emailResults.handwerkerSent,
      clientEmailSent: emailResults.clientSent,
      errorCount: errors.length,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Acceptance emails processed',
        handwerkerEmailSent: emailResults.handwerkerSent,
        clientEmailSent: emailResults.clientSent,
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
