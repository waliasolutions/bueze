import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { newProposalNotificationTemplate } from '../_shared/emailTemplates.ts';

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

    console.log('Processing new proposal notification for:', proposalId);

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

    // Step 2: Fetch client profile using owner_id
    const { data: clientProfile, error: clientError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', proposal.leads?.owner_id)
      .single();

    if (clientError) {
      console.error('Client profile fetch error:', clientError);
    }

    console.log('Client profile fetched:', { 
      email: clientProfile?.email, 
      name: clientProfile?.full_name 
    });

    // Step 3: Fetch handwerker profile
    const { data: handwerkerProfile, error: handwerkerError } = await supabase
      .from('handwerker_profiles')
      .select('user_id, company_name, first_name, last_name, business_city, hourly_rate_min')
      .eq('user_id', proposal.handwerker_id)
      .single();

    if (handwerkerError) {
      console.error('Handwerker profile fetch error:', handwerkerError);
    }

    // Get handwerker first name only for privacy
    const handwerkerFirstName = handwerkerProfile?.first_name || 'Ein Handwerker';
    const handwerkerName = handwerkerProfile?.company_name || handwerkerFirstName;

    console.log('Handwerker profile fetched:', { 
      firstName: handwerkerFirstName, 
      company: handwerkerProfile?.company_name,
      city: handwerkerProfile?.business_city 
    });

    // Validate client email before proceeding
    if (!clientProfile?.email) {
      console.error('Client email is missing - cannot send proposal notification');
      throw new Error('Client email not found');
    }

    // Generate magic token for client
    const token = crypto.randomUUID().replace(/-/g, '');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiry

    const { error: tokenError } = await supabase
      .from('magic_tokens')
      .insert({
        token,
        user_id: proposal.leads?.owner_id,
        resource_type: 'proposal',
        resource_id: proposalId,
        expires_at: expiresAt.toISOString(),
      });

    if (tokenError) {
      console.error('Failed to create magic token:', tokenError);
      // Don't throw - continue without magic link
    }

    const magicLink = `https://bueeze.ch/proposals/${proposalId}?token=${token}`;

    // Fetch handwerker rating stats
    const { data: ratingStats } = await supabase
      .from('handwerker_rating_stats')
      .select('average_rating')
      .eq('user_id', proposal.handwerker_id)
      .single();

    // Send email to client
    const emailHtml = newProposalNotificationTemplate({
      projectTitle: proposal.leads?.title || 'Ihr Projekt',
      handwerkerFirstName: handwerkerFirstName,
      handwerkerCity: handwerkerProfile?.business_city || 'Region',
      priceMin: proposal.price_min,
      priceMax: proposal.price_max,
      rating: ratingStats?.average_rating || undefined,
      magicLink,
      clientName: clientProfile.full_name || 'Kunde',
    });

    console.log('Sending proposal notification email to:', clientProfile.email);

    const emailResponse = await fetch('https://api.smtp2go.com/v3/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Smtp2go-Api-Key': smtp2goApiKey,
      },
      body: JSON.stringify({
        sender: 'noreply@bueeze.ch',
        to: [clientProfile.email],
        subject: `Neue Offerte für Ihr Projekt "${proposal.leads?.title}"`,
        html_body: emailHtml,
      }),
    });

    const emailData = await emailResponse.json();

    console.log('Email response:', { 
      ok: emailResponse.ok, 
      status: emailResponse.status, 
      data: emailData 
    });

    if (!emailResponse.ok) {
      console.error('Email sending failed:', emailData);
      throw new Error(`Email sending failed: ${JSON.stringify(emailData)}`);
    }

    // Insert in-app notification for client
    const clientNotificationResult = await supabase
      .from('client_notifications')
      .insert({
        user_id: proposal.leads?.owner_id,
        type: 'new_proposal',
        title: 'Neue Offerte erhalten',
        message: `${handwerkerName} hat eine Offerte für "${proposal.leads?.title}" eingereicht`,
        related_id: proposalId,
        metadata: { lead_id: proposal.leads?.id }
      });

    if (clientNotificationResult.error) {
      console.error('Failed to create client notification:', clientNotificationResult.error);
      // Don't throw - email was sent successfully, notification is secondary
    } else {
      console.log('Client in-app notification created successfully');
    }

    console.log('Proposal notification sent successfully:', { 
      proposalId, 
      clientEmail: clientProfile.email 
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Proposal notification sent successfully',
        emailData 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in send-proposal-notification:', error);
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
