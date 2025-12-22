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

// Canton to PLZ range mapping for Swiss cantons
const cantonPLZRanges: Record<string, { min: number; max: number }[]> = {
  'ZH': [{ min: 8000, max: 8999 }],
  'BE': [{ min: 3000, max: 3999 }, { min: 2500, max: 2599 }],
  'LU': [{ min: 6000, max: 6099 }, { min: 6100, max: 6199 }, { min: 6200, max: 6299 }, { min: 6300, max: 6399 }],
  'UR': [{ min: 6400, max: 6499 }],
  'SZ': [{ min: 6400, max: 6499 }, { min: 8800, max: 8899 }],
  'OW': [{ min: 6000, max: 6099 }],
  'NW': [{ min: 6300, max: 6399 }],
  'GL': [{ min: 8750, max: 8799 }],
  'ZG': [{ min: 6300, max: 6349 }],
  'FR': [{ min: 1700, max: 1799 }],
  'SO': [{ min: 4500, max: 4599 }, { min: 2540, max: 2549 }],
  'BS': [{ min: 4000, max: 4059 }],
  'BL': [{ min: 4100, max: 4499 }],
  'SH': [{ min: 8200, max: 8299 }],
  'AR': [{ min: 9000, max: 9099 }],
  'AI': [{ min: 9050, max: 9099 }],
  'SG': [{ min: 9000, max: 9499 }],
  'GR': [{ min: 7000, max: 7599 }],
  'AG': [{ min: 5000, max: 5699 }, { min: 8900, max: 8999 }],
  'TG': [{ min: 8500, max: 8599 }, { min: 9200, max: 9399 }],
  'TI': [{ min: 6500, max: 6999 }],
  'VD': [{ min: 1000, max: 1399 }, { min: 1800, max: 1899 }],
  'VS': [{ min: 1900, max: 1999 }, { min: 3900, max: 3999 }],
  'NE': [{ min: 2000, max: 2399 }],
  'GE': [{ min: 1200, max: 1299 }],
  'JU': [{ min: 2800, max: 2999 }]
};

// Check if a PLZ falls within a canton
function plzMatchesCanton(plz: number, canton: string): boolean {
  const ranges = cantonPLZRanges[canton.toUpperCase()];
  if (!ranges) return false;
  return ranges.some(range => plz >= range.min && plz <= range.max);
}

// Check if handwerker service areas match lead location
function handwerkerMatchesServiceArea(serviceAreas: string[], leadPLZ: number, leadCanton: string): boolean {
  if (!serviceAreas || serviceAreas.length === 0) return false;
  
  for (const area of serviceAreas) {
    const trimmedArea = area.trim().toUpperCase();
    
    // Check if area is a canton code (2 uppercase letters)
    if (/^[A-Z]{2}$/.test(trimmedArea)) {
      // Canton match - check if lead's canton matches
      if (trimmedArea === leadCanton.toUpperCase()) {
        return true;
      }
      // Or if lead's PLZ falls within this canton
      if (plzMatchesCanton(leadPLZ, trimmedArea)) {
        return true;
      }
      continue;
    }
    
    // Check for PLZ range (e.g., "8000-8999")
    if (area.includes('-')) {
      const [start, end] = area.split('-').map(p => parseInt(p.trim()));
      if (!isNaN(start) && !isNaN(end)) {
        if (leadPLZ >= start && leadPLZ <= end) {
          return true;
        }
      }
      continue;
    }
    
    // Check for exact PLZ match
    const servicePLZ = parseInt(area.trim());
    if (!isNaN(servicePLZ)) {
      if (leadPLZ === servicePLZ) {
        return true;
      }
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

    console.log(`[send-lead-notification] Lead details: category=${lead.category}, zip=${lead.zip}, canton=${lead.canton}, city=${lead.city}`);

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
    } else {
      console.error('[send-lead-notification] Admin email failed:', adminResult.error);
    }

    // Send Handwerker Notifications - get ALL approved handwerkers first
    const { data: handwerkers, error: handwerkersError } = await supabase
      .from('handwerker_profiles')
      .select('user_id, service_areas, categories, email, first_name, last_name, company_name')
      .eq('verification_status', 'approved');

    if (handwerkersError) {
      throw new Error(`Error fetching handwerkers: ${handwerkersError.message}`);
    }

    console.log(`[send-lead-notification] Found ${handwerkers?.length || 0} approved handwerkers total`);

    const leadPLZ = parseInt(lead.zip?.toString() || '0');
    const leadCanton = lead.canton || '';
    
    // Filter by category (with major category support)
    const categoryMatches = handwerkers?.filter(hw => {
      const matches = handwerkerMatchesCategory(hw.categories || [], lead.category);
      if (matches) {
        console.log(`[send-lead-notification] Category match: ${hw.company_name || hw.first_name} has ${hw.categories?.join(', ')}`);
      }
      return matches;
    }) || [];
    
    console.log(`[send-lead-notification] ${categoryMatches.length} handwerkers match category ${lead.category}`);

    // Filter by service area (with canton support)
    const matchingHandwerkers = categoryMatches.filter(hw => {
      const matches = handwerkerMatchesServiceArea(hw.service_areas || [], leadPLZ, leadCanton);
      if (matches) {
        console.log(`[send-lead-notification] Service area match: ${hw.company_name || hw.first_name} covers ${hw.service_areas?.join(', ')}`);
      } else {
        console.log(`[send-lead-notification] Service area NO match: ${hw.company_name || hw.first_name} has ${hw.service_areas?.join(', ')}, lead PLZ=${leadPLZ}, canton=${leadCanton}`);
      }
      return matches;
    });

    console.log(`[send-lead-notification] ${matchingHandwerkers.length} handwerkers match both category AND service area`);

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
          city: lead.city || 'Nicht angegeben',
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
          subject: `Neue Anfrage in ${categoryLabel} - ${lead.city}`,
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
    });
  } catch (error) {
    console.error('[send-lead-notification] Error:', error);
    return errorResponse(error);
  }
});
