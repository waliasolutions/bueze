import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCorsPreflightRequest, successResponse, errorResponse } from '../_shared/cors.ts';
import { createSupabaseAdmin } from '../_shared/supabaseClient.ts';
import { sendEmail } from '../_shared/smtp2go.ts';
import { fetchClientProfile, createMagicToken } from '../_shared/profileHelpers.ts';
import { getCategoryLabel } from '../_shared/categoryLabels.ts';
import { newLeadNotificationTemplate, newLeadAdminNotificationTemplate } from '../_shared/emailTemplates.ts';

serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  try {
    const { leadId } = await req.json();
    
    if (!leadId) {
      throw new Error('Missing required field: leadId');
    }

    console.log(`[send-lead-notification] Processing lead: ${leadId}`);

    const supabase = createSupabaseAdmin();

    // Fetch lead details
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      throw new Error(`Lead not found: ${leadError?.message}`);
    }

    // Fetch owner profile
    const ownerProfile = await fetchClientProfile(supabase, lead.owner_id);

    const categoryLabel = getCategoryLabel(lead.category);

    // Send Admin Notification Email
    console.log('[send-lead-notification] Sending admin notification email...');
    
    const adminEmailHtml = newLeadAdminNotificationTemplate({
      clientName: ownerProfile?.fullName || 'Unbekannt',
      clientEmail: ownerProfile?.email || 'Unbekannt',
      category: categoryLabel,
      city: lead.city || 'Nicht angegeben',
      canton: lead.canton || '',
      description: lead.description,
      budgetMin: lead.budget_min,
      budgetMax: lead.budget_max,
      urgency: lead.urgency || 'planning',
      leadId: lead.id,
      submittedAt: new Date(lead.created_at).toLocaleDateString('de-CH', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
    });

    const adminResult = await sendEmail({
      to: 'info@bueeze.ch',
      subject: `Neuer Auftrag: ${categoryLabel} in ${lead.city}`,
      htmlBody: adminEmailHtml,
    });

    if (adminResult.success) {
      console.log('[send-lead-notification] Admin notification email sent successfully');
    }

    // Send Handwerker Notifications
    const { data: handwerkers, error: handwerkersError } = await supabase
      .from('handwerker_profiles')
      .select('user_id, service_areas, categories')
      .eq('verification_status', 'approved')
      .contains('categories', [lead.category]);

    if (handwerkersError) {
      throw new Error(`Error fetching handwerkers: ${handwerkersError.message}`);
    }

    console.log(`[send-lead-notification] Found ${handwerkers?.length || 0} potential handwerkers for category ${lead.category}`);

    // Filter by service area
    const leadPLZ = parseInt(lead.zip?.toString() || '0');
    
    const matchingHandwerkers = handwerkers?.filter(hw => {
      if (!hw.service_areas || hw.service_areas.length === 0) return false;
      
      return hw.service_areas.some((area: string) => {
        if (area.includes('-')) {
          const [start, end] = area.split('-').map(p => parseInt(p.trim()));
          if (!isNaN(start) && !isNaN(end)) {
            return leadPLZ >= start && leadPLZ <= end;
          }
        }
        
        const servicePLZ = parseInt(area.trim());
        if (!isNaN(servicePLZ)) {
          return leadPLZ === servicePLZ;
        }
        
        return false;
      });
    }) || [];

    console.log(`[send-lead-notification] ${matchingHandwerkers.length} handwerkers match service area for PLZ ${leadPLZ}`);

    let successCount = 0;
    let errorCount = 0;

    for (const hw of matchingHandwerkers) {
      try {
        const hwProfile = await fetchClientProfile(supabase, hw.user_id);

        if (!hwProfile?.email) {
          console.warn(`[send-lead-notification] No email for handwerker ${hw.user_id}, skipping`);
          errorCount++;
          continue;
        }

        // Generate magic token
        const tokenResult = await createMagicToken(supabase, {
          userId: hw.user_id,
          resourceType: 'lead',
          resourceId: leadId,
          expiryDays: 7,
        });

        if (!tokenResult) {
          errorCount++;
          continue;
        }

        const emailHtml = newLeadNotificationTemplate({
          category: categoryLabel,
          city: lead.city || 'Nicht angegeben',
          description: lead.description,
          budgetMin: lead.budget_min,
          budgetMax: lead.budget_max,
          urgency: lead.urgency || 'normal',
          magicLink: tokenResult.magicLink,
          handwerkerName: hwProfile.fullName || 'Handwerker',
        });

        console.log(`[send-lead-notification] Sending email to ${hwProfile.email}...`);

        const result = await sendEmail({
          to: hwProfile.email,
          subject: `Neue Anfrage in ${categoryLabel} - ${lead.city}`,
          htmlBody: emailHtml,
        });

        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        console.error(`[send-lead-notification] Error processing handwerker ${hw.user_id}:`, error);
        errorCount++;
      }
    }

    console.log(`[send-lead-notification] Complete: ${successCount} success, ${errorCount} errors`);

    return successResponse({ 
      success: true, 
      message: `Admin notified, ${successCount} handwerkers notified`,
      successCount,
      errorCount,
    });
  } catch (error) {
    console.error('[send-lead-notification] Error:', error);
    return errorResponse(error);
  }
});
