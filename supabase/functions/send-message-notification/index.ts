import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCorsPreflightRequest, successResponse, errorResponse } from '../_shared/cors.ts';
import { createSupabaseAdmin } from '../_shared/supabaseClient.ts';
import { sendEmail } from '../_shared/smtp2go.ts';
import { fetchClientProfile } from '../_shared/profileHelpers.ts';
import { newMessageNotificationTemplate } from '../_shared/emailTemplates.ts';

serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  try {
    const { messageId } = await req.json();
    
    if (!messageId) {
      throw new Error('Missing required field: messageId');
    }

    console.log(`[send-message-notification] Processing message: ${messageId}`);

    const supabase = createSupabaseAdmin();

    // Fetch message basic data
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

    // Fetch lead title separately
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

    // Fetch profiles using shared helper
    const senderProfile = await fetchClientProfile(supabase, message.sender_id);
    const recipientProfile = await fetchClientProfile(supabase, message.recipient_id);

    if (!recipientProfile?.email) {
      console.log('[send-message-notification] Recipient email not found, skipping notification');
      return successResponse({ success: true, message: 'No recipient email' });
    }

    const conversationLink = `https://bueeze.ch/messages/${message.conversation_id}`;
    const senderName = senderProfile?.fullName || 'Jemand';
    const recipientName = recipientProfile.fullName || 'Nutzer';

    console.log(`[send-message-notification] Sending notification to ${recipientProfile.email}`);

    const emailHtml = newMessageNotificationTemplate({
      recipientName,
      senderName,
      projectTitle,
      messagePreview: message.content,
      conversationLink,
    });

    const result = await sendEmail({
      to: recipientProfile.email,
      subject: `Neue Nachricht von ${senderName} - Büeze.ch`,
      htmlBody: emailHtml,
    });

    if (!result.success) {
      throw new Error(result.error || 'Email sending failed');
    }

    console.log('[send-message-notification] Message notification sent successfully:', { 
      messageId, 
      recipientEmail: recipientProfile.email 
    });

    return successResponse({ success: true, message: 'Message notification sent' });
  } catch (error) {
    console.error('[send-message-notification] Error:', error);
    return errorResponse(error);
  }
});
