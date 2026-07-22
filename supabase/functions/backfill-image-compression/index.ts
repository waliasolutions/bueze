// Admin-only one-off backfill: recompresses existing JPG/PNG images in
// lead-media and handwerker-portfolio to WebP in-place (same storage key).
// - DB refs untouched (extension is irrelevant; browsers use content-type).
// - Idempotent: already-WebP objects are ignored by the candidate query.
// - Fail-safe: per-object try/catch; originals stay intact on any failure.
// - Batched: process ~10 largest candidates per call to stay within limits.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

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
    // @ts-ignore
    return await decodeJpeg(buf);
  }
  if (mime === 'image/png') {
    // @ts-ignore
    return await decodePng(buf);
  }
  throw new Error(`unsupported mime: ${mime}`);
}

async function processOne(
  bucket: string,
  obj: { name: string; size: number; mimetype: string },
  admin: ReturnType<typeof createClient>,
  quality: number,
  dryRun: boolean,
) {
  const originalSize = Number(obj.size ?? 0);

  const { data: blob, error: dlErr } = await admin.storage.from(bucket).download(obj.name);
  if (dlErr || !blob) throw new Error(`download failed: ${dlErr?.message ?? 'no data'}`);
  const bytes = await blob.arrayBuffer();

  let decoded = await decodeImage(bytes, obj.mimetype);

  if (decoded.width > MAX_WIDTH) {
    const newHeight = Math.round((decoded.height * MAX_WIDTH) / decoded.width);
    // @ts-ignore
    decoded = await resize(decoded, { width: MAX_WIDTH, height: newHeight });
  }

  const webpBytes = await encodeWebp(decoded, { quality: Math.round(quality * 100) });
  const newSize = webpBytes.byteLength;

  if (newSize >= originalSize) {
    return { path: obj.name, originalSize, newSize, action: 'skipped_larger' as const };
  }

  if (dryRun) {
    return { path: obj.name, originalSize, newSize, action: 'would_replace' as const };
  }

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
    const authHeader = req.headers.get('Authorization') ?? '';
    const jwt = authHeader.replace('Bearer ', '');
    if (!jwt) {
      return new Response(JSON.stringify({ error: 'not authenticated' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: isAdmin } = await admin.rpc('has_role', {
      _user_id: userData.user.id, _role: 'admin',
    });
    const { data: isSuper } = await admin.rpc('has_role', {
      _user_id: userData.user.id, _role: 'super_admin',
    });
    if (!isAdmin && !isSuper) {
      return new Response(JSON.stringify({ error: 'admin only' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    // Restrict this maintenance tool to a single operator.
    const ALLOWED_EMAIL = 'info@walia-solutions.ch';
    if ((userData.user.email ?? '').toLowerCase() !== ALLOWED_EMAIL) {
      return new Response(JSON.stringify({ error: 'restricted to operator' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const bucket = String(body.bucket ?? '');
    const mode = String(body.mode ?? 'dry-run');
    // Hard cap: WASM decode+encode of a single large image already approaches
    // the 256 MB edge-runtime budget. Processing more than one per invocation
    // triggers "Memory limit exceeded". Batch by calling this function repeatedly.
    const limit = Math.min(Math.max(Number(body.limit ?? 1), 1), 1);
    const quality = Math.min(Math.max(Number(body.quality ?? DEFAULT_QUALITY), 0.5), 0.95);

    if (!['lead-media', 'handwerker-portfolio'].includes(bucket)) {
      return new Response(JSON.stringify({ error: 'invalid bucket' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!['dry-run', 'apply'].includes(mode)) {
      return new Response(JSON.stringify({ error: 'invalid mode' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const dryRun = mode === 'dry-run';

    const { data: candidates, error: qErr } = await admin.rpc('list_image_backfill_candidates', {
      p_bucket: bucket, p_limit: limit,
    });
    if (qErr) {
      return new Response(JSON.stringify({ error: `candidate query failed: ${qErr.message}` }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const targets = (candidates ?? []) as Array<{ name: string; size: number; mimetype: string }>;

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
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({
      error: err instanceof Error ? err.message : String(err),
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
