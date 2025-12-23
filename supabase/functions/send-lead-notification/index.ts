import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCorsPreflightRequest, successResponse, errorResponse } from '../_shared/cors.ts';
import { createSupabaseAdmin } from '../_shared/supabaseClient.ts';
import { sendEmail } from '../_shared/smtp2go.ts';
import { fetchClientProfile, createMagicToken } from '../_shared/profileHelpers.ts';
import { getCategoryLabel } from '../_shared/categoryLabels.ts';
import { newLeadNotificationTemplate, newLeadAdminNotificationTemplate } from '../_shared/emailTemplates.ts';

// Major category to subcategory mapping for proper matching
const majorCategorySubcategories: Record<string, string[]> = {
  'bau_renovation': [
    'maurer', 'zimmermann', 'mauerarbeit', 'betonarbeiten', 'fundament',
    'kernbohrungen', 'abbruch_durchbruch', 'renovierung_sonstige'
  ],
  'bodenbelaege': [
    'bodenleger', 'parkett_laminat', 'teppich_pvc_linoleum', 'bodenfliese', 'bodenbelag_sonstige'
  ],
  'elektroinstallationen': [
    'elektriker', 'elektro_hausinstallationen', 'elektro_unterverteilung',
    'elektro_stoerung_notfall', 'elektro_beleuchtung', 'elektro_geraete_anschliessen',
    'elektro_netzwerk_multimedia', 'elektro_sprechanlage', 'elektro_smart_home', 'elektro_wallbox'
  ],
  'sanitaer_heizung': [
    'sanitaer', 'heizung', 'klimatechnik'
  ],
  'maler_gipser': [
    'maler', 'gipser'
  ],
  'schreiner_holzbau': [
    'schreiner', 'holzbau', 'fenster_tueren', 'kuechenbau'
  ],
  'dach_fassade': [
    'dachdecker', 'fassadenbauer', 'spengler'
  ],
  'garten_aussen': [
    'gartenbau', 'pflasterarbeiten', 'zaun_torbau', 'garage_carport', 'aussenarbeiten_sonstige'
  ],
  'metallbau': [
    'schlosserei', 'metallbau'
  ],
  'plattenleger': [
    'plattenleger'
  ],
  'umzug_reinigung': [
    'umzug', 'reinigung'
  ],
  'badumbau': [
    'badumbau'
  ]
};

// Get the major category for a subcategory
function getMajorCategoryForSubcategory(subcategory: string): string | null {
  for (const [major, subs] of Object.entries(majorCategorySubcategories)) {
    if (subs.includes(subcategory)) {
      return major;
    }
  }
  return null;
}

// Check if handwerker categories match lead category (including major category matching)
function handwerkerMatchesCategory(handwerkerCategories: string[], leadCategory: string): boolean {
  // Direct match
  if (handwerkerCategories.includes(leadCategory)) {
    return true;
  }
  
  // Check if lead category is a major category
  const majorSubs = majorCategorySubcategories[leadCategory];
  if (majorSubs) {
    // Lead is a major category - match if handwerker has any subcategory of this major
    return handwerkerCategories.some(cat => majorSubs.includes(cat));
  }
  
  // Lead is a subcategory - check if handwerker has same major category
  const leadMajor = getMajorCategoryForSubcategory(leadCategory);
  if (leadMajor) {
    const majorSubcats = majorCategorySubcategories[leadMajor];
    if (majorSubcats) {
      return handwerkerCategories.some(cat => majorSubcats.includes(cat));
    }
  }
  
  return false;
}

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

    // NORMALIZE PLZ - strip anything not a digit and parse as integer
    const leadPLZ = parseInt((lead.zip?.toString() || '0').replace(/\D/g, ''));
    const leadCanton = lead.canton || '';

    console.log(`[send-lead-notification] Lead details: category=${lead.category}, PLZ=${leadPLZ}, canton=${leadCanton}, city=${lead.city}`);

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
      canton: leadCanton,
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
      subject: `Neuer Auftrag: ${categoryLabel} in ${lead.city || `PLZ ${leadPLZ}`}`,
      htmlBody: adminEmailHtml,
    });

    if (adminResult.success) {
      console.log('[send-lead-notification] Admin notification email sent successfully');
    } else {
      console.error('[send-lead-notification] Admin email failed:', adminResult.error);
    }

    // BULLETPROOF MATCHING: Query handwerker_service_areas with PLZ range
    console.log(`[send-lead-notification] Querying service areas for PLZ ${leadPLZ}...`);
    
    const { data: serviceAreaMatches, error: serviceAreaError } = await supabase
      .from('handwerker_service_areas')
      .select('handwerker_id')
      .lte('start_plz', leadPLZ)
      .gte('end_plz', leadPLZ);

    if (serviceAreaError) {
      console.error('[send-lead-notification] Error querying service areas:', serviceAreaError.message);
    }

    const matchedHandwerkerIds = new Set(
      (serviceAreaMatches || []).map(sa => sa.handwerker_id)
    );

    console.log(`[send-lead-notification] Found ${matchedHandwerkerIds.size} handwerkers via service_areas table`);

    // FALLBACK: Also check legacy service_areas column for backward compatibility
    const { data: allHandwerkers, error: handwerkersError } = await supabase
      .from('handwerker_profiles')
      .select('id, user_id, service_areas, categories, email, first_name, last_name, company_name')
      .eq('verification_status', 'approved');

    if (handwerkersError) {
      throw new Error(`Error fetching handwerkers: ${handwerkersError.message}`);
    }

    console.log(`[send-lead-notification] Found ${allHandwerkers?.length || 0} approved handwerkers total`);

    // Filter by category first
    const categoryMatches = allHandwerkers?.filter(hw => {
      const matches = handwerkerMatchesCategory(hw.categories || [], lead.category);
      return matches;
    }) || [];
    
    console.log(`[send-lead-notification] ${categoryMatches.length} handwerkers match category ${lead.category}`);

    // Filter by service area - use new table OR legacy column
    const matchingHandwerkers = categoryMatches.filter(hw => {
      // Check new service_areas table first
      if (matchedHandwerkerIds.has(hw.id)) {
        console.log(`[send-lead-notification] ✓ ${hw.company_name || hw.first_name}: matched via service_areas table`);
        return true;
      }
      
      // Fallback: check legacy service_areas column
      const serviceAreas = hw.service_areas || [];
      for (const area of serviceAreas) {
        const trimmedArea = area.trim().toUpperCase();
        
        // Check if area is a canton code (2 uppercase letters)
        if (/^[A-Z]{2}$/.test(trimmedArea)) {
          // Simple canton match by lead canton
          if (trimmedArea === leadCanton.toUpperCase()) {
            console.log(`[send-lead-notification] ✓ ${hw.company_name || hw.first_name}: canton match ${trimmedArea}`);
            return true;
          }
          continue;
        }
        
        // Check for PLZ range (e.g., "8000-8999")
        if (area.includes('-')) {
          const [start, end] = area.split('-').map(p => parseInt(p.trim()));
          if (!isNaN(start) && !isNaN(end) && leadPLZ >= start && leadPLZ <= end) {
            console.log(`[send-lead-notification] ✓ ${hw.company_name || hw.first_name}: PLZ range match ${area}`);
            return true;
          }
          continue;
        }
        
        // Check for exact PLZ match
        const servicePLZ = parseInt(area.trim());
        if (!isNaN(servicePLZ) && leadPLZ === servicePLZ) {
          console.log(`[send-lead-notification] ✓ ${hw.company_name || hw.first_name}: exact PLZ match ${area}`);
          return true;
        }
      }
      
      return false;
    });

    console.log(`[send-lead-notification] ${matchingHandwerkers.length} handwerkers match both category AND service area`);

    // ORPHAN LEAD FALLBACK: If no matches, create admin notification
    if (matchingHandwerkers.length === 0) {
      console.warn(`[send-lead-notification] ⚠️ ORPHAN LEAD: No handwerkers found for PLZ ${leadPLZ}, category ${lead.category}`);
      
      await supabase.from('admin_notifications').insert({
        type: 'orphan_lead',
        title: 'Auftrag ohne Handwerker-Match',
        message: `Keine passenden Handwerker gefunden für PLZ ${leadPLZ}, Kategorie: ${categoryLabel}`,
        related_id: leadId,
        metadata: {
          zip: leadPLZ,
          canton: leadCanton,
          city: lead.city,
          category: lead.category,
          categoryLabel: categoryLabel,
          owner_email: ownerProfile?.email,
        }
      });
      
      console.log('[send-lead-notification] Orphan lead notification created for admin');
    }

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
          console.error(`[send-lead-notification] Failed to create magic token for ${hw.user_id}`);
          errorCount++;
          continue;
        }

        const emailHtml = newLeadNotificationTemplate({
          category: categoryLabel,
          city: lead.city || `PLZ ${leadPLZ}`,
          description: lead.description,
          budgetMin: lead.budget_min,
          budgetMax: lead.budget_max,
          urgency: lead.urgency || 'normal',
          magicLink: tokenResult.magicLink,
          handwerkerName: hwProfile.fullName || hw.first_name || 'Handwerker',
        });

        console.log(`[send-lead-notification] Sending email to ${hwProfile.email}...`);

        const result = await sendEmail({
          to: hwProfile.email,
          subject: `Neue Anfrage in ${categoryLabel} - ${lead.city || `PLZ ${leadPLZ}`}`,
          htmlBody: emailHtml,
        });

        if (result.success) {
          console.log(`[send-lead-notification] ✓ Email sent to ${hwProfile.email}`);
          successCount++;
        } else {
          console.error(`[send-lead-notification] ✗ Email failed for ${hwProfile.email}: ${result.error}`);
          errorCount++;
        }
      } catch (error) {
        console.error(`[send-lead-notification] Error processing handwerker ${hw.user_id}:`, error);
        errorCount++;
      }
    }

    console.log(`[send-lead-notification] Complete: ${successCount} success, ${errorCount} errors out of ${matchingHandwerkers.length} matching handwerkers`);

    return successResponse({ 
      success: true, 
      message: `Admin notified, ${successCount} handwerkers notified`,
      matchingHandwerkersCount: matchingHandwerkers.length,
      successCount,
      errorCount,
      isOrphanLead: matchingHandwerkers.length === 0,
    });
  } catch (error) {
    console.error('[send-lead-notification] Error:', error);
    return errorResponse(error);
  }
});
