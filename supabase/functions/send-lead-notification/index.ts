import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { handleCorsPreflightRequest, successResponse, errorResponse } from '../_shared/cors.ts';
import { createSupabaseAdmin } from '../_shared/supabaseClient.ts';
import { sendEmail } from '../_shared/smtp2go.ts';
import { fetchClientProfile } from '../_shared/profileHelpers.ts';
import { FRONTEND_URL, SUPPORT_EMAIL } from '../_shared/siteConfig.ts';
import { getCategoryLabel } from '../_shared/categoryLabels.ts';
import { newLeadNotificationTemplate, newLeadAdminNotificationTemplate } from '../_shared/emailTemplates.ts';
import { formatSwissDateTime } from '../_shared/dateFormatter.ts';

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

// Swiss canton codes
const SWISS_CANTONS = ['AG', 'AI', 'AR', 'BE', 'BL', 'BS', 'FR', 'GE', 'GL', 'GR', 'JU', 'LU', 'NE', 'NW', 'OW', 'SG', 'SH', 'SO', 'SZ', 'TG', 'TI', 'UR', 'VD', 'VS', 'ZG', 'ZH'];

interface HandwerkerMatch {
  id: string;
  user_id: string;
  categories: string[];
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  service_areas: string[];
  matchType: 'canton' | 'plz' | 'nationwide';
}

// Match handwerkers based on service_areas column (canton codes or PLZ codes)
function matchHandwerkerByServiceArea(
  serviceAreas: string[],
  leadCanton: string,
  leadPLZ: string
): { matches: boolean; matchType: 'canton' | 'plz' | 'nationwide' | null } {
  if (!serviceAreas || serviceAreas.length === 0) {
    return { matches: false, matchType: null };
  }

  // Check for nationwide coverage (all 26 cantons)
  const cantonCount = serviceAreas.filter(area => SWISS_CANTONS.includes(area)).length;
  if (cantonCount >= 26) {
    return { matches: true, matchType: 'nationwide' };
  }

  // Check for canton match
  if (serviceAreas.includes(leadCanton)) {
    return { matches: true, matchType: 'canton' };
  }

  // Check for exact PLZ match
  if (serviceAreas.includes(leadPLZ)) {
    return { matches: true, matchType: 'plz' };
  }

  return { matches: false, matchType: null };
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
      .select('id, title, description, category, city, canton, zip, budget_min, budget_max, urgency, owner_id, created_at')
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
      submittedAt: formatSwissDateTime(lead.created_at),
    });

    const adminResult = await sendEmail({
      to: SUPPORT_EMAIL,
      subject: `Neuer Auftrag: ${categoryLabel} in ${lead.city || `PLZ ${leadPLZ}`}`,
      htmlBody: adminEmailHtml,
    });

    if (adminResult.success) {
      console.log('[send-lead-notification] Admin notification email sent successfully');
    } else {
      console.error('[send-lead-notification] Admin email failed:', adminResult.error);
    }

    // SERVICE AREA MATCHING: Match based on handwerker_profiles.service_areas
    console.log(`[send-lead-notification] Finding handwerkers for canton=${leadCanton}, PLZ=${lead.zip}...`);

    // Fetch all approved handwerkers with their service_areas
    const { data: allHandwerkers, error: handwerkersError } = await supabase
      .from('handwerker_profiles')
      .select('id, user_id, categories, email, first_name, last_name, company_name, service_areas')
      .eq('verification_status', 'approved');

    if (handwerkersError) {
      throw new Error(`Error fetching handwerkers: ${handwerkersError.message}`);
    }

    console.log(`[send-lead-notification] Found ${allHandwerkers?.length || 0} approved handwerkers`);

    // Filter handwerkers by service area AND category
    const matchingHandwerkers: HandwerkerMatch[] = [];
    
    for (const hw of allHandwerkers || []) {
      // Check service area match
      const areaMatch = matchHandwerkerByServiceArea(
        hw.service_areas || [],
        leadCanton,
        lead.zip?.toString() || ''
      );
      
      if (!areaMatch.matches) continue;
      
      // Check category match
      if (!handwerkerMatchesCategory(hw.categories || [], lead.category)) continue;
      
      matchingHandwerkers.push({
        ...hw,
        matchType: areaMatch.matchType!
      });
    }

    console.log(`[send-lead-notification] ${matchingHandwerkers.length} handwerkers match both service area AND category`);

    // Log match types for debugging
    const matchTypeCounts = matchingHandwerkers.reduce((acc, hw) => {
      acc[hw.matchType] = (acc[hw.matchType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log(`[send-lead-notification] Match types:`, matchTypeCounts);

    // ORPHAN LEAD: Create admin notification if no matches
    if (matchingHandwerkers.length === 0) {
      console.warn(`[send-lead-notification] ⚠️ ORPHAN LEAD: No handwerkers found for canton=${leadCanton}, PLZ=${lead.zip}, category=${lead.category}`);
      
      await supabase.from('admin_notifications').insert({
        type: 'orphan_lead',
        title: 'Auftrag ohne Handwerker-Match',
        message: `Keine passenden Handwerker gefunden für ${lead.city} (${leadCanton}), Kategorie: ${categoryLabel}`,
        related_id: leadId,
        metadata: {
          zip: lead.zip,
          canton: leadCanton,
          city: lead.city,
          category: lead.category,
          categoryLabel: categoryLabel,
          owner_email: ownerProfile?.email,
          totalApprovedHandwerkers: allHandwerkers?.length || 0,
        }
      });
      
      console.log('[send-lead-notification] Orphan lead notification created for admin');
    }

    let successCount = 0;
    let errorCount = 0;

    // Batch-fetch all handwerker profiles (avoids N+1 queries)
    const matchedUserIds = matchingHandwerkers.map(hw => hw.user_id);
    const { data: profilesData } = matchedUserIds.length > 0
      ? await supabase
          .from('profiles')
          .select('id, email, full_name')
          .in('id', matchedUserIds)
      : { data: [] };

    const profileMap = new Map(
      (profilesData || []).map(p => [p.id, p])
    );

    // Batch-create all magic tokens (avoids N+1 inserts)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    const tokenRecords = matchingHandwerkers.map(hw => ({
      token: crypto.randomUUID().replace(/-/g, ''),
      user_id: hw.user_id,
      resource_type: 'lead',
      resource_id: leadId,
      expires_at: expiresAt.toISOString(),
    }));

    if (tokenRecords.length > 0) {
      const { error: tokenError } = await supabase.from('magic_tokens').insert(tokenRecords);
      if (tokenError) {
        console.error('[send-lead-notification] Batch token insert failed:', tokenError.message);
      }
    }

    const tokenMap = new Map(
      tokenRecords.map(t => [t.user_id, t.token])
    );

    // Send emails using pre-fetched data
    for (const hw of matchingHandwerkers) {
      try {
        const profile = profileMap.get(hw.user_id);
        const email = profile?.email || hw.email;

        if (!email) {
          console.warn(`[send-lead-notification] No email for handwerker ${hw.user_id}, skipping`);
          errorCount++;
          continue;
        }

        const token = tokenMap.get(hw.user_id);
        if (!token) {
          console.error(`[send-lead-notification] No token for ${hw.user_id}, skipping`);
          errorCount++;
          continue;
        }

        const magicLink = `${FRONTEND_URL}/opportunity/${leadId}?token=${token}`;
        const handwerkerName = profile?.full_name || hw.first_name || 'Handwerker';

        const emailHtml = newLeadNotificationTemplate({
          category: categoryLabel,
          city: lead.city || `PLZ ${lead.zip}`,
          description: lead.description,
          budgetMin: lead.budget_min,
          budgetMax: lead.budget_max,
          urgency: lead.urgency || 'planning',
          magicLink,
          handwerkerName,
        });

        const result = await sendEmail({
          to: email,
          subject: `Neue Anfrage in ${categoryLabel} - ${lead.city || `PLZ ${lead.zip}`}`,
          htmlBody: emailHtml,
        });

        if (result.success) {
          successCount++;
        } else {
          console.error(`[send-lead-notification] ✗ Email failed for ${email}: ${result.error}`);
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
    return errorResponse(error as Error);
  }
});
