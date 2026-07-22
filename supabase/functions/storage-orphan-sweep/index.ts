import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCorsPreflightRequest, successResponse, errorResponse } from '../_shared/cors.ts';
import { createSupabaseAdmin } from '../_shared/supabaseClient.ts';

/**
 * Storage orphan sweep — finds objects in public storage buckets that are no
 * longer referenced by any DB row and (optionally) deletes them.
 *
 * Safety gates:
 *  - dry_run defaults to TRUE. Nothing is deleted unless the caller passes
 *    dry_run:false explicitly.
 *  - min_age_hours defaults to 24. Objects newer than that are always skipped
 *    so active uploads/drafts are never removed.
 *  - Only admins (or the cron service role) can invoke this.
 */

interface SweepReport {
  bucket: string;
  scanned: number;
  eligible: number;   // scanned - too_young
  orphans: number;
  deleted: number;
  too_young: number;
  errors: string[];
}

const BUCKETS = ['handwerker-portfolio', 'lead-media'] as const;

/** Normalize a stored URL/path to the object key inside a bucket. */
function normalizeKey(bucket: string, value: string | null | undefined): string | null {
  if (!value) return null;
  const marker = `/storage/v1/object/public/${bucket}/`;
  const i = value.indexOf(marker);
  if (i !== -1) return decodeURIComponent(value.slice(i + marker.length));
  // Fallback: assume value is already a raw key
  return value.replace(/^\/+/, '');
}

async function collectReferencedKeys(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  bucket: string,
): Promise<Set<string>> {
  const refs = new Set<string>();
  const push = (v: string | null | undefined) => {
    const k = normalizeKey(bucket, v);
    if (k) refs.add(k);
  };

  if (bucket === 'handwerker-portfolio') {
    const { data } = await supabase
      .from('handwerker_profiles')
      .select('portfolio_urls, profile_image_url');
    for (const row of data ?? []) {
      (row.portfolio_urls ?? []).forEach(push);
      push(row.profile_image_url);
    }
  }

  if (bucket === 'lead-media') {
    const { data } = await supabase.from('leads').select('media_urls');
    for (const row of data ?? []) (row.media_urls ?? []).forEach(push);
  }

  return refs;
}

async function sweepBucket(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  bucket: string,
  dryRun: boolean,
  minAgeHours: number,
): Promise<SweepReport> {
  const report: SweepReport = {
    bucket, scanned: 0, eligible: 0, orphans: 0, deleted: 0, too_young: 0, errors: [],
  };
  const cutoff = Date.now() - minAgeHours * 3600 * 1000;
  const referenced = await collectReferencedKeys(supabase, bucket);

  // Walk the bucket (top-level list, then per-folder for user-partitioned buckets)
  const toVisit: string[] = [''];
  const orphanKeys: string[] = [];
  while (toVisit.length) {
    const prefix = toVisit.shift()!;
    let offset = 0;
    for (;;) {
      const { data, error } = await supabase.storage.from(bucket).list(prefix, {
        limit: 1000, offset, sortBy: { column: 'name', order: 'asc' },
      });
      if (error) { report.errors.push(`${bucket}/${prefix}: ${error.message}`); break; }
      if (!data || data.length === 0) break;
      for (const item of data) {
        const key = prefix ? `${prefix}/${item.name}` : item.name;
        // Folders have no id/metadata — recurse
        if (!item.id) { toVisit.push(key); continue; }
        report.scanned++;
        const created = item.created_at ? new Date(item.created_at).getTime() : 0;
        if (created && created > cutoff) { report.too_young++; continue; }
        report.eligible++;
        if (!referenced.has(key)) {
          report.orphans++;
          orphanKeys.push(key);
        }
      }
      if (data.length < 1000) break;
      offset += data.length;
    }
  }

  if (!dryRun && orphanKeys.length > 0) {
    // Delete in batches of 100
    for (let i = 0; i < orphanKeys.length; i += 100) {
      const batch = orphanKeys.slice(i, i + 100);
      const { data, error } = await supabase.storage.from(bucket).remove(batch);
      if (error) { report.errors.push(`remove ${bucket}: ${error.message}`); continue; }
      report.deleted += data?.length ?? 0;
    }
  }

  return report;
}

serve(async (req) => {
  const cors = handleCorsPreflightRequest(req);
  if (cors) return cors;

  try {
    const supabase = createSupabaseAdmin();

    // Authz: admin JWT OR service-role cron secret
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace('Bearer ', '');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    let authorized = false;
    if (token && serviceKey && token === serviceKey) {
      authorized = true;
    } else if (token) {
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
        authorized = !!roles?.some(r => r.role === 'admin' || r.role === 'super_admin');
      }
    }
    if (!authorized) return errorResponse('Admin-Zugang erforderlich', 403);

    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const dryRun = body?.dry_run !== false;              // default TRUE
    const minAgeHours = Number.isFinite(body?.min_age_hours) ? Number(body.min_age_hours) : 24;

    const reports: SweepReport[] = [];
    for (const bucket of BUCKETS) {
      reports.push(await sweepBucket(supabase, bucket, dryRun, minAgeHours));
    }

    return successResponse({
      success: true,
      dry_run: dryRun,
      min_age_hours: minAgeHours,
      reports,
      run_at: new Date().toISOString(),
    });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Unbekannter Fehler', 500);
  }
});
