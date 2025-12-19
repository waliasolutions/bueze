import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { newMessageNotificationTemplate } from '../_shared/emailTemplates.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messageId } = await req.json();
    
    if (!messageId) {
      throw new Error('Missing required field: messageId');
    }

    console.log(`[send-message-notification] Processing message: ${messageId}`);

    const smtp2goApiKey = Deno.env.get('SMTP2GO_API_KEY');
    if (!smtp2goApiKey) {
      throw new Error('SMTP2GO_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Step 1: Fetch message basic data
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        sender_id,
        recipient_id,
        conversation_id,
        lead_id
      `)
      .eq('id', messageId)
      .single();

    if (messageError || !message) {
      throw new Error(`Message not found: ${messageError?.message}`);
    }

    console.log(`[send-message-notification] Message found, conversation: ${message.conversation_id}`);

    // Step 2: Fetch lead title separately
    let projectTitle = 'Projekt';
    if (message.lead_id) {
      const { data: lead } = await supabase
        .from('leads')
        .select('title')
        .eq('id', message.lead_id)
        .single();
      
      if (lead?.title) {
        projectTitle = lead.title;
      }
    }

    // Step 3: Fetch sender profile separately
    const { data: senderProfile, error: senderError } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', message.sender_id)
      .single();

    if (senderError) {
      console.warn(`[send-message-notification] Could not fetch sender profile: ${senderError.message}`);
    }

    // Step 4: Fetch recipient profile separately
    const { data: recipientProfile, error: recipientError } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', message.recipient_id)
      .single();

    if (recipientError || !recipientProfile?.email) {
      console.log('[send-message-notification] Recipient email not found, skipping notification');
      return new Response(
        JSON.stringify({ success: true, message: 'No recipient email' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const conversationLink = `https://bueeze.ch/messages/${message.conversation_id}`;
    const senderName = senderProfile?.full_name || 'Jemand';
    const recipientName = recipientProfile.full_name || 'Nutzer';

    console.log(`[send-message-notification] Sending notification to ${recipientProfile.email}`);

    const emailHtml = newMessageNotificationTemplate({
      recipientName,
      senderName,
      projectTitle,
      messagePreview: message.content,
      conversationLink,
    });

    const emailResponse = await fetch('https://api.smtp2go.com/v3/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Smtp2go-Api-Key': smtp2goApiKey,
      },
      body: JSON.stringify({
        sender: 'noreply@bueeze.ch',
        to: [recipientProfile.email],
        subject: `Neue Nachricht von ${senderName} - Büeze.ch`,
        html_body: emailHtml,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error('[send-message-notification] Email sending failed:', emailData);
      throw new Error(`Email sending failed: ${JSON.stringify(emailData)}`);
    }

    console.log('[send-message-notification] Message notification sent successfully:', { 
      messageId, 
      recipientEmail: recipientProfile.email 
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Message notification sent' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('[send-message-notification] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
