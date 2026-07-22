// Admin-only one-off backfill: recompresses existing images in lead-media and
// handwerker-portfolio buckets to WebP (in-place, same storage key).
// - DB refs untouched (extension irrelevant; browsers honor content-type).
// - Idempotent: image/webp objects are skipped.
// - Fail-safe: per-object try/catch; originals remain untouched on any failure.
// - Batched: process ~20 objects per invocation to stay within edge time limits.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// jsquash: pure WASM image codecs that run in Deno edge runtime.
import decodeJpeg, { init as initJpegDecode } from 'https://esm.sh/@jsquash/jpeg@1.5.0/decode';
import decodePng, { init as initPngDecode } from 'https://esm.sh/@jsquash/png@3.0.1/decode';
import encodeWebp, { init as initWebpEncode } from 'https://esm.sh/@jsquash/webp@1.4.0/encode';
import resize, { initResize } from 'https://esm.sh/@jsquash/resize@2.1.0';

type ImageData = { data: Uint8ClampedArray; width: number; height: number };

const MAX_WIDTH = 1920;
const DEFAULT_QUALITY = 0.85;

async function decodeImage(bytes: ArrayBuffer, mime: string): Promise<ImageData> {
  const buf = new Uint8Array(bytes);
  if (mime === 'image/jpeg' || mime === 'image/jpg') {
    // @ts-ignore - jsquash returns ImageData-like structure
    return await decodeJpeg(buf);
  }
  if (mime === 'image/png') {
    // @ts-ignore
    return await decodePng(buf);
  }
  throw new Error(`unsupported mime: ${mime}`);
}

async function processOne(bucket: string, obj: { name: string; metadata: any },
                          admin: ReturnType<typeof createClient>,
                          quality: number,
                          dryRun: boolean) {
  const originalSize = Number(obj.metadata?.size ?? 0);
  const mime = String(obj.metadata?.mimetype ?? '');

  // Download bytes
  const { data: blob, error: dlErr } = await admin.storage.from(bucket).download(obj.name);
  if (dlErr || !blob) throw new Error(`download failed: ${dlErr?.message ?? 'no data'}`);
  const bytes = await blob.arrayBuffer();

  // Decode
  let decoded = await decodeImage(bytes, mime);

  // Resize if needed (proportional)
  if (decoded.width > MAX_WIDTH) {
    const newHeight = Math.round((decoded.height * MAX_WIDTH) / decoded.width);
    // @ts-ignore
    decoded = await resize(decoded, { width: MAX_WIDTH, height: newHeight });
  }

  // Encode WebP (quality 0-100 for jsquash)
  const webpBytes = await encodeWebp(decoded, { quality: Math.round(quality * 100) });
  const newSize = webpBytes.byteLength;

  if (newSize >= originalSize) {
    return { path: obj.name, originalSize, newSize, action: 'skipped_larger' as const };
  }

  if (dryRun) {
    return { path: obj.name, originalSize, newSize, action: 'would_replace' as const };
  }

  // Upload in-place (same key, overwrite)
  const { error: upErr } = await admin.storage.from(bucket).upload(obj.name, webpBytes, {
    upsert: true,
    contentType: 'image/webp',
    cacheControl: '3600',
  });
  if (upErr) throw new Error(`upload failed: ${upErr.message}`);

  return { path: obj.name, originalSize, newSize, action: 'replaced' as const };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // Admin auth check
    const authHeader = req.headers.get('Authorization') ?? '';
    const jwt = authHeader.replace('Bearer ', '');
    if (!jwt) {
      return new Response(JSON.stringify({ error: 'not authenticated' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: 'invalid session' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: isAdmin } = await admin.rpc('has_role', {
      _user_id: userData.user.id, _role: 'admin'
    });
    const { data: isSuper } = await admin.rpc('has_role', {
      _user_id: userData.user.id, _role: 'super_admin'
    });
    if (!isAdmin && !isSuper) {
      return new Response(JSON.stringify({ error: 'admin only' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse input
    const body = await req.json().catch(() => ({}));
    const bucket = String(body.bucket ?? '');
    const mode = String(body.mode ?? 'dry-run');
    const limit = Math.min(Math.max(Number(body.limit ?? 20), 1), 50);
    const quality = Math.min(Math.max(Number(body.quality ?? DEFAULT_QUALITY), 0.5), 0.95);

    if (!['lead-media', 'handwerker-portfolio'].includes(bucket)) {
      return new Response(JSON.stringify({ error: 'invalid bucket' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    if (!['dry-run', 'apply'].includes(mode)) {
      return new Response(JSON.stringify({ error: 'invalid mode' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const dryRun = mode === 'dry-run';

    // Query candidates directly from storage.objects via SQL (recursive across all folders)
    const { data: candidates, error: qErr } = await admin
      .from('objects_backfill_candidates' as any)
      .select('*')
      .limit(limit); // Fallback path — will use RPC below if view missing.

    // Since we cannot rely on a view, query storage.objects via rpc-less path:
    let rows: Array<{ name: string; metadata: any }> = [];
    if (qErr || !candidates) {
      const { data, error } = await admin.rpc('exec_sql' as any, {}).catch(() => ({ data: null, error: 'no rpc' } as any));
      // Direct SQL not available; use PostgREST on storage.objects (allowed via service_role)
      const url = `${supabaseUrl}/rest/v1/storage/objects?bucket_id=eq.${bucket}&select=name,metadata&limit=${limit}`;
      const resp = await fetch(url, {
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      });
      if (resp.ok) {
        rows = await resp.json();
      }
    } else {
      rows = candidates as any;
    }

    // Filter: only jpg/png, skip webp/gif
    const targets = rows.filter((r) => {
      const m = String(r.metadata?.mimetype ?? '');
      return m === 'image/jpeg' || m === 'image/jpg' || m === 'image/png';
    });

    // Init WASM once
    await Promise.all([
      initJpegDecode().catch(() => {}),
      initPngDecode().catch(() => {}),
      initWebpEncode().catch(() => {}),
      initResize().catch(() => {}),
    ]);

    const results: any[] = [];
    let totalBefore = 0;
    let totalAfter = 0;

    for (const obj of targets) {
      try {
        const r = await processOne(bucket, obj, admin, quality, dryRun);
        results.push(r);
        totalBefore += r.originalSize;
        totalAfter += r.newSize;
      } catch (err) {
        results.push({
          path: obj.name,
          action: 'failed',
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return new Response(JSON.stringify({
      bucket, mode, quality, examined: targets.length,
      total_before_bytes: totalBefore,
      total_after_bytes: totalAfter,
      estimated_savings_bytes: totalBefore - totalAfter,
      results,
    }, null, 2), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({
      error: err instanceof Error ? err.message : String(err),
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
