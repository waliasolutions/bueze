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

    const smtp2goApiKey = Deno.env.get('SMTP2GO_API_KEY');
    if (!smtp2goApiKey) {
      throw new Error('SMTP2GO_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch proposal with lead and handwerker details
    const { data: proposal, error: proposalError } = await supabase
      .from('lead_proposals')
      .select(`
        *,
        leads!lead_proposals_lead_id_fkey(
          id,
          title,
          user_id,
          profiles!leads_user_id_fkey(email, full_name)
        ),
        handwerker_profiles!lead_proposals_handwerker_id_fkey(
          profiles!handwerker_profiles_user_id_fkey(full_name),
          city,
          average_rating
        )
      `)
      .eq('id', proposalId)
      .single();

    if (proposalError || !proposal) {
      throw new Error(`Proposal not found: ${proposalError?.message}`);
    }

    // Get handwerker first name only for privacy
    const fullName = proposal.handwerker_profiles?.profiles?.full_name || 'Ein Handwerker';
    const firstName = fullName.split(' ')[0];

    // Generate magic token for client
    const token = crypto.randomUUID().replace(/-/g, '');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiry

    const { error: tokenError } = await supabase
      .from('magic_tokens')
      .insert({
        token,
        user_id: proposal.leads?.user_id,
        resource_type: 'proposal',
        resource_id: proposalId,
        expires_at: expiresAt.toISOString(),
      });

    if (tokenError) {
      throw new Error(`Failed to create magic token: ${tokenError.message}`);
    }

    const magicLink = `https://bueze.ch/proposals/${proposalId}?token=${token}`;

    // Send email to client
    const emailHtml = newProposalNotificationTemplate({
      projectTitle: proposal.leads?.title || 'Ihr Projekt',
      handwerkerFirstName: firstName,
      handwerkerCity: proposal.handwerker_profiles?.city || 'Region',
      priceMin: proposal.price_min,
      priceMax: proposal.price_max,
      rating: proposal.handwerker_profiles?.average_rating,
      magicLink,
      clientName: proposal.leads?.profiles?.full_name || 'Kunde',
    });

    const emailResponse = await fetch('https://api.smtp2go.com/v3/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Smtp2go-Api-Key': smtp2goApiKey,
      },
      body: JSON.stringify({
        sender: 'noreply@bueze.ch',
        to: [proposal.leads?.profiles?.email],
        subject: `Neue Offerte für Ihr Projekt "${proposal.leads?.title}"`,
        html_body: emailHtml,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      throw new Error(`Email sending failed: ${JSON.stringify(emailData)}`);
    }

    console.log('Proposal notification sent successfully:', { 
      proposalId, 
      clientEmail: proposal.leads?.profiles?.email 
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
