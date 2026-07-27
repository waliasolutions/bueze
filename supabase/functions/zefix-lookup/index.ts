/**
 * zefix-lookup — the only path from the app to the Zefix Public REST API.
 *
 * Actions:
 *   search  { query, limit? }  → public. Company-name or UID search.
 *   detail  { uid }            → public. Full record for one UID.
 *   verify  { profileId }      → authenticated. Re-reads the profile's UID from
 *                                the database, resolves it at Zefix and persists
 *                                zefix_verified / zefix_data. Server-authoritative:
 *                                clients can never mark themselves as verified.
 *
 * search/detail stay public because registration happens before the account
 * exists and the commercial registry is public data anyway; a small per-IP
 * budget keeps our Zefix credentials from being used as an open proxy.
 */

import { handleCorsPreflightRequest, successResponse, errorResponse } from '../_shared/cors.ts';
import { createSupabaseAdmin } from '../_shared/supabaseClient.ts';
import { getErrorMessage } from '../_shared/errorUtils.ts';
import { fetchCompanyByUid, searchCompanies } from '../_shared/zefix.ts';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 25;

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 30;
const requestLog = new Map<string, number[]>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (requestLog.get(key) ?? []).filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  requestLog.set(key, recent);

  // Keep the map from growing without bound on a long-lived instance.
  if (requestLog.size > 500) {
    for (const [entryKey, timestamps] of requestLog) {
      if (timestamps.every((ts) => now - ts >= RATE_LIMIT_WINDOW_MS)) requestLog.delete(entryKey);
    }
  }

  return recent.length > RATE_LIMIT_MAX_REQUESTS;
}

type SupabaseAdmin = ReturnType<typeof createSupabaseAdmin>;

/** The caller may verify a profile if they own it or hold an admin role. */
async function assertCanVerify(req: Request, supabase: SupabaseAdmin, profileUserId: string | null) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) throw new Error('Nicht angemeldet');

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) throw new Error('Nicht angemeldet');

  if (profileUserId && user.id === profileUserId) return;

  const { data: role } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .in('role', ['admin', 'super_admin'])
    .maybeSingle();

  if (!role) throw new Error('Keine Berechtigung für dieses Profil');
}

/**
 * Resolve the profile's stored UID at Zefix and write the result back.
 * A missing or unknown UID clears the verification instead of leaving it stale.
 */
async function verifyProfile(req: Request, profileId: string) {
  const supabase = createSupabaseAdmin();

  const { data: profile, error } = await supabase
    .from('handwerker_profiles')
    .select('id, user_id, uid_number')
    .eq('id', profileId)
    .maybeSingle();

  if (error) throw error;
  if (!profile) throw new Error('Profil nicht gefunden');

  await assertCanVerify(req, supabase, profile.user_id);

  const company = profile.uid_number ? await fetchCompanyByUid(profile.uid_number) : null;

  const { error: updateError } = await supabase
    .from('handwerker_profiles')
    .update({ zefix_verified: company !== null, zefix_data: company })
    .eq('id', profile.id);

  if (updateError) throw updateError;

  return { verified: company !== null, company };
}

Deno.serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  try {
    const clientKey = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (isRateLimited(clientKey)) {
      return errorResponse('Zu viele Anfragen. Bitte warten Sie einen Moment.', 429);
    }

    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    switch (action) {
      case 'search': {
        const limit = Math.min(Number(body.limit) || DEFAULT_LIMIT, MAX_LIMIT);
        const companies = await searchCompanies(String(body.query ?? ''), limit);
        return successResponse({ companies });
      }

      case 'detail': {
        const company = await fetchCompanyByUid(String(body.uid ?? ''));
        return successResponse({ company });
      }

      case 'verify': {
        if (!body.profileId) return errorResponse('profileId fehlt', 400);
        return successResponse(await verifyProfile(req, String(body.profileId)));
      }

      default:
        return errorResponse(`Unbekannte Aktion: ${action ?? 'keine'}`, 400);
    }
  } catch (error: unknown) {
    const message = getErrorMessage(error);

    // Auth failures are the caller's problem; everything else is ours and gets
    // sanitized + logged by errorResponse.
    return /angemeldet|Berechtigung|nicht gefunden/.test(message)
      ? errorResponse(message, 403)
      : errorResponse(message, 502);
  }
});
