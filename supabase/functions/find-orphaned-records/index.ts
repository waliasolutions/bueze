import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCorsPreflightRequest, successResponse, errorResponse } from '../_shared/cors.ts';
import { createSupabaseAdmin } from '../_shared/supabaseClient.ts';

/**
 * Admin-only function to detect orphaned records.
 * Called from the admin UI (OrphanedRecordsCleanup.tsx).
 */

interface OrphanReport {
  orphaned_profiles: { id: string; email: string }[];
  orphaned_user_roles: { id: string; user_id: string }[];
  orphaned_handwerker_profiles: { id: string; email: string | null; user_id: string }[];
  orphaned_subscriptions: { id: string; user_id: string }[];
  orphaned_client_notifications: number;
  orphaned_handwerker_notifications: number;
  orphaned_reviews: number;
  orphaned_lead_proposals: number;
  orphaned_lead_views: number;
  orphaned_lead_purchases: number;
  orphaned_leads: number;
  orphaned_magic_tokens: number;
  orphaned_payment_history: number;
  orphaned_handwerker_documents: number;
  orphaned_messages: number;
  orphaned_conversations: number;
  total_orphans: number;
  scan_timestamp: string;
}

/** Paginate through all auth users to build a complete set of IDs */
async function getAllAuthUserIds(supabase: ReturnType<typeof createSupabaseAdmin>): Promise<Set<string>> {
  const authUserIds = new Set<string>();
  let page = 1;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`Fehler beim Abrufen der Auth-Benutzer (Seite ${page}): ${error.message}`);
    data.users.forEach(u => authUserIds.add(u.id));
    if (data.users.length < 1000) break;
    page++;
  }
  return authUserIds;
}

serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  try {
    const supabase = createSupabaseAdmin();

    // ── Auth: require JWT + admin role ──
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return errorResponse('Nicht autorisiert', 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: caller }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !caller) {
      return errorResponse('Ungültiges Token', 401);
    }

    const { data: callerRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', caller.id);

    const isAdmin = callerRoles?.some(r => r.role === 'admin' || r.role === 'super_admin');
    if (!isAdmin) {
      return errorResponse('Admin-Zugang erforderlich', 403);
    }

    console.log('[ORPHAN-CHECK] Admin', caller.email, 'hat Scan gestartet');

    // ── Scan logic ──
    const report: OrphanReport = {
      orphaned_profiles: [],
      orphaned_user_roles: [],
      orphaned_handwerker_profiles: [],
      orphaned_subscriptions: [],
      orphaned_client_notifications: 0,
      orphaned_handwerker_notifications: 0,
      orphaned_reviews: 0,
      orphaned_lead_proposals: 0,
      orphaned_lead_views: 0,
      orphaned_lead_purchases: 0,
      orphaned_leads: 0,
      orphaned_magic_tokens: 0,
      orphaned_payment_history: 0,
      orphaned_handwerker_documents: 0,
      orphaned_messages: 0,
      orphaned_conversations: 0,
      total_orphans: 0,
      scan_timestamp: new Date().toISOString(),
    };

    const authUserIds = await getAllAuthUserIds(supabase);
    console.log(`[ORPHAN-CHECK] ${authUserIds.size} Auth-Benutzer gefunden (alle Seiten)`);

    // 1. Orphaned profiles
    const { data: profiles } = await supabase.from('profiles').select('id, email').limit(5000);
    if (profiles) {
      for (const profile of profiles) {
        if (!authUserIds.has(profile.id)) {
          report.orphaned_profiles.push({ id: profile.id, email: profile.email });
        }
      }
    }

    // 2. Orphaned user_roles
    const { data: userRoles } = await supabase.from('user_roles').select('id, user_id').limit(5000);
    if (userRoles) {
      for (const role of userRoles) {
        if (!authUserIds.has(role.user_id)) {
          report.orphaned_user_roles.push({ id: role.id, user_id: role.user_id });
        }
      }
    }

    // 3. Orphaned handwerker_profiles
    const { data: hwProfiles } = await supabase.from('handwerker_profiles').select('id, email, user_id').not('user_id', 'is', null).limit(5000);
    if (hwProfiles) {
      for (const profile of hwProfiles) {
        if (profile.user_id && !authUserIds.has(profile.user_id)) {
          report.orphaned_handwerker_profiles.push({ id: profile.id, email: profile.email, user_id: profile.user_id });
        }
      }
    }

    // 4. Orphaned subscriptions
    const { data: subscriptions } = await supabase.from('handwerker_subscriptions').select('id, user_id').limit(5000);
    if (subscriptions) {
      for (const sub of subscriptions) {
        if (!authUserIds.has(sub.user_id)) {
          report.orphaned_subscriptions.push({ id: sub.id, user_id: sub.user_id });
        }
      }
    }

    // 5. Orphaned notifications
    const { data: clientNotifs } = await supabase.from('client_notifications').select('user_id').limit(5000);
    if (clientNotifs) report.orphaned_client_notifications = clientNotifs.filter(n => !authUserIds.has(n.user_id)).length;

    const { data: hwNotifs } = await supabase.from('handwerker_notifications').select('user_id').limit(5000);
    if (hwNotifs) report.orphaned_handwerker_notifications = hwNotifs.filter(n => !authUserIds.has(n.user_id)).length;

    // 6. Orphaned reviews
    const { data: reviews } = await supabase.from('reviews').select('reviewer_id, reviewed_id').limit(5000);
    if (reviews) report.orphaned_reviews = reviews.filter(r => !authUserIds.has(r.reviewer_id) || !authUserIds.has(r.reviewed_id)).length;

    // 7-9. Orphaned lead data
    const { data: proposals } = await supabase.from('lead_proposals').select('handwerker_id').limit(5000);
    if (proposals) report.orphaned_lead_proposals = proposals.filter(p => !authUserIds.has(p.handwerker_id)).length;

    const { data: leadViews } = await supabase.from('lead_views').select('viewer_id').limit(5000);
    if (leadViews) report.orphaned_lead_views = leadViews.filter(v => !authUserIds.has(v.viewer_id)).length;

    const { data: purchases } = await supabase.from('lead_purchases').select('buyer_id').limit(5000);
    if (purchases) report.orphaned_lead_purchases = purchases.filter(p => !authUserIds.has(p.buyer_id)).length;

    // 10. Orphaned leads
    const { data: leads } = await supabase.from('leads').select('owner_id').limit(5000);
    if (leads) report.orphaned_leads = leads.filter(l => !authUserIds.has(l.owner_id)).length;

    // 11. Orphaned magic_tokens
    const { data: tokens } = await supabase.from('magic_tokens').select('user_id').not('user_id', 'is', null).limit(5000);
    if (tokens) report.orphaned_magic_tokens = tokens.filter(t => t.user_id && !authUserIds.has(t.user_id)).length;

    // 12. Orphaned payment_history
    const { data: payments } = await supabase.from('payment_history').select('user_id').limit(5000);
    if (payments) report.orphaned_payment_history = payments.filter(p => !authUserIds.has(p.user_id)).length;

    // 13. Orphaned handwerker_documents
    const { data: docs } = await supabase.from('handwerker_documents').select('user_id').limit(5000);
    if (docs) report.orphaned_handwerker_documents = docs.filter(d => !authUserIds.has(d.user_id)).length;

    // 14. Orphaned messages
    const { data: messages } = await supabase.from('messages').select('sender_id, recipient_id').limit(5000);
    if (messages) report.orphaned_messages = messages.filter(m => !authUserIds.has(m.sender_id) || !authUserIds.has(m.recipient_id)).length;

    // 15. Orphaned conversations
    const { data: conversations } = await supabase.from('conversations').select('homeowner_id, handwerker_id').limit(5000);
    if (conversations) report.orphaned_conversations = conversations.filter(c => !authUserIds.has(c.homeowner_id) || !authUserIds.has(c.handwerker_id)).length;

    // Calculate total
    report.total_orphans =
      report.orphaned_profiles.length +
      report.orphaned_user_roles.length +
      report.orphaned_handwerker_profiles.length +
      report.orphaned_subscriptions.length +
      report.orphaned_client_notifications +
      report.orphaned_handwerker_notifications +
      report.orphaned_reviews +
      report.orphaned_lead_proposals +
      report.orphaned_lead_views +
      report.orphaned_lead_purchases +
      report.orphaned_leads +
      report.orphaned_magic_tokens +
      report.orphaned_payment_history +
      report.orphaned_handwerker_documents +
      report.orphaned_messages +
      report.orphaned_conversations;

    console.log(`[ORPHAN-CHECK] Total verwaiste Datensätze: ${report.total_orphans}`);

    if (report.total_orphans > 0) {
      const summary = [
        report.orphaned_profiles.length > 0 ? `${report.orphaned_profiles.length} Profile` : '',
        report.orphaned_user_roles.length > 0 ? `${report.orphaned_user_roles.length} Benutzerrollen` : '',
        report.orphaned_handwerker_profiles.length > 0 ? `${report.orphaned_handwerker_profiles.length} Handwerker-Profile` : '',
        report.orphaned_subscriptions.length > 0 ? `${report.orphaned_subscriptions.length} Abonnements` : '',
        report.orphaned_reviews > 0 ? `${report.orphaned_reviews} Bewertungen` : '',
        report.orphaned_lead_proposals > 0 ? `${report.orphaned_lead_proposals} Offerten` : '',
        report.orphaned_leads > 0 ? `${report.orphaned_leads} Aufträge` : '',
        report.orphaned_messages > 0 ? `${report.orphaned_messages} Nachrichten` : '',
        report.orphaned_conversations > 0 ? `${report.orphaned_conversations} Konversationen` : '',
      ].filter(Boolean).join(', ');

      await supabase.from('admin_notifications').insert({
        type: 'orphaned_records',
        title: 'Verwaiste Datensätze gefunden',
        message: `${report.total_orphans} verwaiste Datensätze gefunden: ${summary}. Bitte prüfen und bereinigen.`,
        metadata: { report, orphaned_emails: report.orphaned_profiles.map(p => p.email) },
      });
    }

    return successResponse({
      success: true,
      message: report.total_orphans === 0
        ? 'Keine verwaisten Datensätze gefunden'
        : `${report.total_orphans} verwaiste Datensätze gefunden`,
      report,
    });

  } catch (error) {
    console.error('[ORPHAN-CHECK] Fehler:', error);

    try {
      const supabase = createSupabaseAdmin();
      await supabase.from('admin_notifications').insert({
        type: 'orphan_scan_failed',
        title: 'Verwaiste-Datensätze-Scan fehlgeschlagen',
        message: `Fehler beim Scannen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
        metadata: { error: error instanceof Error ? error.message : 'Unbekannter Fehler' },
      });
    } catch (notifError) {
      console.error('[ORPHAN-CHECK] Fehler beim Erstellen der Admin-Benachrichtigung:', notifError);
    }

    return errorResponse(error instanceof Error ? error.message : 'Unbekannter Fehler', 500);
  }
});
