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

// Short-window burst guard (in-memory, per warm instance).
// The authoritative quotas (10/user/2h, 100/IP/day) live in the DB.
const BURST_WINDOW_MS = 60_000;
const BURST_MAX = 30;
const burstLog = new Map<string, number[]>();

function isBursting(key: string): boolean {
  const now = Date.now();
  const recent = (burstLog.get(key) ?? []).filter((ts) => now - ts < BURST_WINDOW_MS);
  recent.push(now);
  burstLog.set(key, recent);
  if (burstLog.size > 500) {
    for (const [k, ts] of burstLog) {
      if (ts.every((t) => now - t >= BURST_WINDOW_MS)) burstLog.delete(k);
    }
  }
  return recent.length > BURST_MAX;
}

async function hashIp(ip: string): Promise<string> {
  const data = new TextEncoder().encode(`zefix:${ip}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function getCallerUserId(req: Request, supabase: SupabaseAdmin): Promise<string | null> {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return null;
  const { data: { user } } = await supabase.auth.getUser(token);
  return user?.id ?? null;
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
    const rawIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (isBursting(rawIp)) {
      return errorResponse('Zu viele Anfragen. Bitte warten Sie einen Moment.', 429);
    }

    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    // Verify has its own auth + is server-authoritative; skip quota there.
    if (action === 'verify') {
      if (!body.profileId) return errorResponse('profileId fehlt', 400);
      return successResponse(await verifyProfile(req, String(body.profileId)));
    }

    if (action !== 'search' && action !== 'detail') {
      return errorResponse(`Unbekannte Aktion: ${action ?? 'keine'}`, 400);
    }

    // DB-backed quotas: 10/user/2h, 100/IP/day.
    const supabase = createSupabaseAdmin();
    const userId = await getCallerUserId(req, supabase);
    const ipHash = rawIp !== 'unknown' ? await hashIp(rawIp) : null;

    const { data: gate, error: gateError } = await supabase.rpc('check_zefix_rate_limit', {
      p_user_id: userId,
      p_ip_hash: ipHash,
    });
    if (gateError) throw gateError;
    if (gate && !gate.allowed) {
      const msg = gate.reason === 'user'
        ? 'Sie haben das Limit von 10 Handelsregister-Abfragen pro 2 Stunden erreicht. Bitte versuchen Sie es später erneut.'
        : 'Das tägliche Handelsregister-Abfragelimit wurde erreicht. Bitte versuchen Sie es morgen erneut.';
      return errorResponse(msg, 429);
    }

    // Record the lookup (fire-and-forget on failure).
    await supabase.rpc('record_zefix_lookup', {
      p_user_id: userId,
      p_ip_hash: ipHash,
      p_action: action,
    });

    if (action === 'search') {
      const limit = Math.min(Number(body.limit) || DEFAULT_LIMIT, MAX_LIMIT);
      const companies = await searchCompanies(String(body.query ?? ''), limit);
      return successResponse({ companies });
    }

    const company = await fetchCompanyByUid(String(body.uid ?? ''));
    return successResponse({ company });
  } catch (error: unknown) {
    const message = getErrorMessage(error);

    // Auth failures are the caller's problem; everything else is ours and gets
    // sanitized + logged by errorResponse.
    return /angemeldet|Berechtigung|nicht gefunden/.test(message)
      ? errorResponse(message, 403)
      : errorResponse(message, 502);
  }
});
