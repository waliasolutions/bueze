import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCorsPreflightRequest, successResponse, errorResponse } from '../_shared/cors.ts';
import { createSupabaseAdmin } from '../_shared/supabaseClient.ts';

/**
 * Scheduled function to detect orphaned records
 * Run via Supabase cron: daily at 3 AM
 * 
 * Detects:
 * - Profiles without corresponding auth users
 * - User roles without corresponding auth users
 * - Handwerker profiles with user_id that doesn't exist
 * - Subscriptions without corresponding auth users
 * - Notifications without corresponding auth users
 */

interface OrphanReport {
  orphaned_profiles: { id: string; email: string }[];
  orphaned_user_roles: { id: string; user_id: string }[];
  orphaned_handwerker_profiles: { id: string; email: string | null; user_id: string }[];
  orphaned_subscriptions: { id: string; user_id: string }[];
  orphaned_client_notifications: number;
  orphaned_handwerker_notifications: number;
  total_orphans: number;
  scan_timestamp: string;
}

serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  try {
    const supabase = createSupabaseAdmin();
    console.log('[ORPHAN-CHECK] Starte Suche nach verwaisten Datensätzen...');

    const report: OrphanReport = {
      orphaned_profiles: [],
      orphaned_user_roles: [],
      orphaned_handwerker_profiles: [],
      orphaned_subscriptions: [],
      orphaned_client_notifications: 0,
      orphaned_handwerker_notifications: 0,
      total_orphans: 0,
      scan_timestamp: new Date().toISOString(),
    };

    // Get all auth user IDs for comparison
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.error('[ORPHAN-CHECK] Fehler beim Abrufen der Auth-Benutzer:', authError);
      throw new Error(`Fehler beim Abrufen der Auth-Benutzer: ${authError.message}`);
    }

    const authUserIds = new Set(authUsers.users.map(u => u.id));
    console.log(`[ORPHAN-CHECK] ${authUserIds.size} Auth-Benutzer gefunden`);

    // 1. Check for orphaned profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email');

    if (profiles) {
      for (const profile of profiles) {
        if (!authUserIds.has(profile.id)) {
          report.orphaned_profiles.push({ id: profile.id, email: profile.email });
        }
      }
    }
    console.log(`[ORPHAN-CHECK] ${report.orphaned_profiles.length} verwaiste Profile gefunden`);

    // 2. Check for orphaned user_roles
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('id, user_id');

    if (userRoles) {
      for (const role of userRoles) {
        if (!authUserIds.has(role.user_id)) {
          report.orphaned_user_roles.push({ id: role.id, user_id: role.user_id });
        }
      }
    }
    console.log(`[ORPHAN-CHECK] ${report.orphaned_user_roles.length} verwaiste user_roles gefunden`);

    // 3. Check for orphaned handwerker_profiles (with user_id that doesn't exist)
    const { data: hwProfiles } = await supabase
      .from('handwerker_profiles')
      .select('id, email, user_id')
      .not('user_id', 'is', null);

    if (hwProfiles) {
      for (const profile of hwProfiles) {
        if (profile.user_id && !authUserIds.has(profile.user_id)) {
          report.orphaned_handwerker_profiles.push({
            id: profile.id,
            email: profile.email,
            user_id: profile.user_id,
          });
        }
      }
    }
    console.log(`[ORPHAN-CHECK] ${report.orphaned_handwerker_profiles.length} verwaiste handwerker_profiles gefunden`);

    // 4. Check for orphaned subscriptions
    const { data: subscriptions } = await supabase
      .from('handwerker_subscriptions')
      .select('id, user_id');

    if (subscriptions) {
      for (const sub of subscriptions) {
        if (!authUserIds.has(sub.user_id)) {
          report.orphaned_subscriptions.push({ id: sub.id, user_id: sub.user_id });
        }
      }
    }
    console.log(`[ORPHAN-CHECK] ${report.orphaned_subscriptions.length} verwaiste Abonnements gefunden`);

    // 5. Count orphaned notifications (don't list all for brevity)
    const { data: clientNotifs } = await supabase
      .from('client_notifications')
      .select('user_id');

    if (clientNotifs) {
      report.orphaned_client_notifications = clientNotifs.filter(
        n => !authUserIds.has(n.user_id)
      ).length;
    }

    const { data: hwNotifs } = await supabase
      .from('handwerker_notifications')
      .select('user_id');

    if (hwNotifs) {
      report.orphaned_handwerker_notifications = hwNotifs.filter(
        n => !authUserIds.has(n.user_id)
      ).length;
    }

    // Calculate total
    report.total_orphans =
      report.orphaned_profiles.length +
      report.orphaned_user_roles.length +
      report.orphaned_handwerker_profiles.length +
      report.orphaned_subscriptions.length +
      report.orphaned_client_notifications +
      report.orphaned_handwerker_notifications;

    console.log(`[ORPHAN-CHECK] Total verwaiste Datensätze: ${report.total_orphans}`);

    // Create admin notification if orphans found
    if (report.total_orphans > 0) {
      const summary = [
        report.orphaned_profiles.length > 0 ? `${report.orphaned_profiles.length} Profile` : '',
        report.orphaned_user_roles.length > 0 ? `${report.orphaned_user_roles.length} Benutzerrollen` : '',
        report.orphaned_handwerker_profiles.length > 0 ? `${report.orphaned_handwerker_profiles.length} Handwerker-Profile` : '',
        report.orphaned_subscriptions.length > 0 ? `${report.orphaned_subscriptions.length} Abonnements` : '',
        report.orphaned_client_notifications > 0 ? `${report.orphaned_client_notifications} Kunden-Benachrichtigungen` : '',
        report.orphaned_handwerker_notifications > 0 ? `${report.orphaned_handwerker_notifications} Handwerker-Benachrichtigungen` : '',
      ].filter(Boolean).join(', ');

      await supabase.from('admin_notifications').insert({
        type: 'orphaned_records',
        title: 'Verwaiste Datensätze gefunden',
        message: `${report.total_orphans} verwaiste Datensätze gefunden: ${summary}. Bitte prüfen und bereinigen.`,
        metadata: {
          report,
          orphaned_emails: report.orphaned_profiles.map(p => p.email),
        },
      });

      console.log('[ORPHAN-CHECK] Admin-Benachrichtigung erstellt');
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
    
    // Try to create admin notification for scan failure
    try {
      const supabase = createSupabaseAdmin();
      await supabase.from('admin_notifications').insert({
        type: 'orphan_scan_failed',
        title: 'Verwaiste-Datensätze-Scan fehlgeschlagen',
        message: `Fehler beim Scannen nach verwaisten Datensätzen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
        metadata: { error: error instanceof Error ? error.message : 'Unbekannter Fehler' },
      });
    } catch (notifError) {
      console.error('[ORPHAN-CHECK] Fehler beim Erstellen der Admin-Benachrichtigung:', notifError);
    }
    
    return errorResponse(
      error instanceof Error ? error.message : 'Unbekannter Fehler',
      500
    );
  }
});
