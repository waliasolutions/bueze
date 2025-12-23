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
  if (handwerkerCategories.includes(leadCategory)) return true;
  
  const majorSubs = majorCategorySubcategories[leadCategory];
  if (majorSubs) {
    return handwerkerCategories.some(cat => majorSubs.includes(cat));
  }
  
  const leadMajor = getMajorCategoryForSubcategory(leadCategory);
  if (leadMajor) {
    const majorSubcats = majorCategorySubcategories[leadMajor];
    if (majorSubcats) {
      return handwerkerCategories.some(cat => majorSubcats.includes(cat));
    }
  }
  
  return false;
}

// Match levels for elastic matching
type MatchLevel = 1 | 2 | 3 | 4 | 5;

interface MatchResult {
  handwerkerIds: string[];
  matchLevel: MatchLevel;
  matchDescription: string;
}

// 5-Layer Elastic Matching - Single query, layered filtering
async function findHandwerkersWithElasticMatching(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  leadPLZ: number
): Promise<MatchResult> {
  // Single broad query - fetch all service areas in the same regional range (8xxx)
  const firstDigit = Math.floor(leadPLZ / 1000);
  const broadRangeStart = firstDigit * 1000;
  const broadRangeEnd = broadRangeStart + 999;
  
  const { data: allAreas, error } = await supabase
    .from('handwerker_service_areas')
    .select('handwerker_id, start_plz, end_plz')
    .lte('start_plz', broadRangeEnd)
    .gte('end_plz', broadRangeStart);
  
  if (error) {
    console.error('[elastic-matching] Query error:', error.message);
    return { handwerkerIds: [], matchLevel: 5, matchDescription: 'Datenbankfehler' };
  }

  const areas = allAreas || [];
  console.log(`[elastic-matching] Fetched ${areas.length} service areas in ${broadRangeStart}-${broadRangeEnd} range`);

  // Layer 1: Exact PLZ match
  const exactMatches = areas.filter(sa => leadPLZ >= sa.start_plz && leadPLZ <= sa.end_plz);
  if (exactMatches.length > 0) {
    return {
      handwerkerIds: [...new Set(exactMatches.map(m => m.handwerker_id))],
      matchLevel: 1,
      matchDescription: 'Exakte PLZ-Übereinstimmung'
    };
  }

  // Layer 2: District (first 3 digits, e.g., 804x)
  const districtStart = Math.floor(leadPLZ / 10) * 10;
  const districtEnd = districtStart + 9;
  const districtMatches = areas.filter(sa => !(sa.end_plz < districtStart || sa.start_plz > districtEnd));
  if (districtMatches.length > 0) {
    return {
      handwerkerIds: [...new Set(districtMatches.map(m => m.handwerker_id))],
      matchLevel: 2,
      matchDescription: 'Bezirk-Übereinstimmung'
    };
  }

  // Layer 3: Regional (first 2 digits, e.g., 80xx)
  const regionalStart = Math.floor(leadPLZ / 100) * 100;
  const regionalEnd = regionalStart + 99;
  const regionalMatches = areas.filter(sa => !(sa.end_plz < regionalStart || sa.start_plz > regionalEnd));
  if (regionalMatches.length > 0) {
    return {
      handwerkerIds: [...new Set(regionalMatches.map(m => m.handwerker_id))],
      matchLevel: 3,
      matchDescription: 'Regionale Übereinstimmung'
    };
  }

  // Layer 4: Broad region fallback (all in 8xxx range)
  if (areas.length > 0) {
    return {
      handwerkerIds: [...new Set(areas.map(m => m.handwerker_id))],
      matchLevel: 4,
      matchDescription: 'Erweiterte Region'
    };
  }

  // Layer 5: Orphan - no matches
  return {
    handwerkerIds: [],
    matchLevel: 5,
    matchDescription: 'Keine Übereinstimmung - Admin benachrichtigt'
  };
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

    const leadPLZ = parseInt((lead.zip?.toString() || '0').replace(/\D/g, ''));
    const leadCanton = lead.canton || '';

    console.log(`[send-lead-notification] Lead details: category=${lead.category}, PLZ=${leadPLZ}, canton=${leadCanton}, city=${lead.city}`);

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

    // ELASTIC MATCHING: 5-layer fallback system
    console.log(`[send-lead-notification] Running elastic matching for PLZ ${leadPLZ}...`);
    const matchResult = await findHandwerkersWithElasticMatching(supabase, leadPLZ);
    console.log(`[send-lead-notification] Match result: Level ${matchResult.matchLevel} - ${matchResult.matchDescription} (${matchResult.handwerkerIds.length} handwerkers)`);

    // Fetch all approved handwerkers to filter by category
    const { data: allHandwerkers, error: handwerkersError } = await supabase
      .from('handwerker_profiles')
      .select('id, user_id, categories, email, first_name, last_name, company_name')
      .eq('verification_status', 'approved');

    if (handwerkersError) {
      throw new Error(`Error fetching handwerkers: ${handwerkersError.message}`);
    }

    // Filter matched handwerkers by category
    const matchingHandwerkers = (allHandwerkers || []).filter(hw => 
      matchResult.handwerkerIds.includes(hw.id) && 
      handwerkerMatchesCategory(hw.categories || [], lead.category)
    );

    console.log(`[send-lead-notification] ${matchingHandwerkers.length} handwerkers match both location AND category`);

    // Determine final match level (may need to escalate if category filtering reduces matches)
    let finalMatchLevel = matchResult.matchLevel;
    if (matchingHandwerkers.length === 0 && matchResult.handwerkerIds.length > 0) {
      // Had location matches but no category matches
      finalMatchLevel = 5;
    }

    // ORPHAN LEAD: Create admin notification if no matches
    if (matchingHandwerkers.length === 0) {
      console.warn(`[send-lead-notification] ⚠️ ORPHAN LEAD: No handwerkers found for PLZ ${leadPLZ}, category ${lead.category}`);
      
      await supabase.from('admin_notifications').insert({
        type: 'orphan_lead',
        title: 'Auftrag ohne Handwerker-Match',
        message: `Keine passenden Handwerker gefunden für PLZ ${leadPLZ}, Kategorie: ${categoryLabel}. Match-Level: ${matchResult.matchLevel}`,
        related_id: leadId,
        metadata: {
          zip: leadPLZ,
          canton: leadCanton,
          city: lead.city,
          category: lead.category,
          categoryLabel: categoryLabel,
          owner_email: ownerProfile?.email,
          matchLevel: matchResult.matchLevel,
          matchDescription: matchResult.matchDescription,
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
      matchLevel: finalMatchLevel,
      matchDescription: matchResult.matchDescription,
      successCount,
      errorCount,
      isOrphanLead: matchingHandwerkers.length === 0,
    });
  } catch (error) {
    console.error('[send-lead-notification] Error:', error);
    return errorResponse(error);
  }
});
