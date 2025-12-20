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
    console.log('[ORPHAN-CHECK] Starting orphaned records scan...');

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
      console.error('[ORPHAN-CHECK] Failed to list auth users:', authError);
      throw new Error(`Failed to list auth users: ${authError.message}`);
    }

    const authUserIds = new Set(authUsers.users.map(u => u.id));
    console.log(`[ORPHAN-CHECK] Found ${authUserIds.size} auth users`);

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
    console.log(`[ORPHAN-CHECK] Found ${report.orphaned_profiles.length} orphaned profiles`);

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
    console.log(`[ORPHAN-CHECK] Found ${report.orphaned_user_roles.length} orphaned user_roles`);

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
    console.log(`[ORPHAN-CHECK] Found ${report.orphaned_handwerker_profiles.length} orphaned handwerker_profiles`);

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
    console.log(`[ORPHAN-CHECK] Found ${report.orphaned_subscriptions.length} orphaned subscriptions`);

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

    console.log(`[ORPHAN-CHECK] Total orphaned records: ${report.total_orphans}`);

    // Create admin notification if orphans found
    if (report.total_orphans > 0) {
      const summary = [
        report.orphaned_profiles.length > 0 ? `${report.orphaned_profiles.length} profiles` : '',
        report.orphaned_user_roles.length > 0 ? `${report.orphaned_user_roles.length} user_roles` : '',
        report.orphaned_handwerker_profiles.length > 0 ? `${report.orphaned_handwerker_profiles.length} handwerker_profiles` : '',
        report.orphaned_subscriptions.length > 0 ? `${report.orphaned_subscriptions.length} subscriptions` : '',
        report.orphaned_client_notifications > 0 ? `${report.orphaned_client_notifications} client notifications` : '',
        report.orphaned_handwerker_notifications > 0 ? `${report.orphaned_handwerker_notifications} handwerker notifications` : '',
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

      console.log('[ORPHAN-CHECK] Admin notification created');
    }

    return successResponse({
      success: true,
      message: report.total_orphans === 0 
        ? 'No orphaned records found'
        : `Found ${report.total_orphans} orphaned records`,
      report,
    });

  } catch (error) {
    console.error('[ORPHAN-CHECK] Error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
});
