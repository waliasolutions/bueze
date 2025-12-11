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

    const smtp2goApiKey = Deno.env.get('SMTP2GO_API_KEY');
    if (!smtp2goApiKey) {
      throw new Error('SMTP2GO_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch message with conversation and lead details
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        sender_id,
        recipient_id,
        conversation_id,
        conversations!messages_conversation_id_fkey(
          id,
          lead_id,
          homeowner_id,
          handwerker_id,
          leads!conversations_lead_id_fkey(title)
        )
      `)
      .eq('id', messageId)
      .single();

    if (messageError || !message) {
      throw new Error(`Message not found: ${messageError?.message}`);
    }

    // Get sender and recipient profiles
    const [senderResult, recipientResult] = await Promise.all([
      supabase.from('profiles').select('full_name, email').eq('id', message.sender_id).single(),
      supabase.from('profiles').select('full_name, email').eq('id', message.recipient_id).single()
    ]);

    if (!recipientResult.data?.email) {
      console.log('Recipient email not found, skipping notification');
      return new Response(
        JSON.stringify({ success: true, message: 'No recipient email' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const conversationLink = `https://bueeze.ch/messages/${message.conversation_id}`;
    const projectTitle = message.conversations?.leads?.title || 'Projekt';

    const emailHtml = newMessageNotificationTemplate({
      recipientName: recipientResult.data.full_name || 'Nutzer',
      senderName: senderResult.data?.full_name || 'Jemand',
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
        to: [recipientResult.data.email],
        subject: `Neue Nachricht von ${senderResult.data?.full_name || 'einem Nutzer'} - Büeze.ch`,
        html_body: emailHtml,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      throw new Error(`Email sending failed: ${JSON.stringify(emailData)}`);
    }

    console.log('Message notification sent:', { messageId, recipientEmail: recipientResult.data.email });

    return new Response(
      JSON.stringify({ success: true, message: 'Message notification sent' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error in send-message-notification:', error);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
