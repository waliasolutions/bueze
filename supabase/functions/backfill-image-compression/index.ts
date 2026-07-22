// Admin-only image backfill coordinator.
// Heavy image decoding/encoding runs in the admin browser via the shared
// client compressor. This function only lists candidates and commits already
// compressed WebP bytes, avoiding Edge Runtime WASM memory pressure.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const ALLOWED_EMAIL = 'info@walia-solutions.ch';
const ALLOWED_BUCKETS = ['lead-media', 'handwerker-portfolio'];

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function decodeBase64(base64: string): Uint8Array {
  const normalized = base64.includes(',') ? base64.split(',').pop() ?? '' : base64;
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function findObjectMetadata(
  admin: ReturnType<typeof createClient>,
  bucket: string,
  objectName: string,
): Promise<{ size: number; mimetype: string } | null> {
  const parts = objectName.split('/').filter(Boolean);
  const fileName = parts.pop();
  if (!fileName) return null;
  const folder = parts.join('/');

  const { data, error } = await admin.storage.from(bucket).list(folder, {
    limit: 100,
    search: fileName,
  });
  if (error) throw new Error(`storage metadata lookup failed: ${error.message}`);

  const match = (data ?? []).find((item) => item.name === fileName);
  if (!match) return null;
  const metadata = match.metadata as Record<string, unknown> | null;
  return {
    size: Number(metadata?.size ?? 0),
    mimetype: String(metadata?.mimetype ?? ''),
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const jwt = authHeader.replace('Bearer ', '');
    if (!jwt) {
      return json({ error: 'not authenticated' }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return json({ error: 'invalid session' }, 401);
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: isAdmin } = await admin.rpc('has_role', {
      _user_id: userData.user.id, _role: 'admin',
    });
    const { data: isSuper } = await admin.rpc('has_role', {
      _user_id: userData.user.id, _role: 'super_admin',
    });
    if (!isAdmin && !isSuper) {
      return json({ error: 'admin only' }, 403);
    }
    // Restrict this maintenance tool to a single operator.
    if ((userData.user.email ?? '').toLowerCase() !== ALLOWED_EMAIL) {
      return json({ error: 'restricted to operator' }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? 'list');
    const bucket = String(body.bucket ?? '');

    if (!ALLOWED_BUCKETS.includes(bucket)) {
      return json({ error: 'invalid bucket' }, 400);
    }

    if (action === 'list') {
      const limit = Math.min(Math.max(Number(body.limit ?? 10), 1), 200);
      const { data: candidates, error: qErr } = await admin.rpc('list_image_backfill_candidates', {
        p_bucket: bucket, p_limit: limit,
      });
      if (qErr) {
        return json({ error: `candidate query failed: ${qErr.message}` }, 500);
      }

      const targets = (candidates ?? []) as Array<{ name: string; size: number; mimetype: string; created_at?: string }>;
      return json({ bucket, action, examined: targets.length, candidates: targets });
    }

    if (action !== 'commit') {
      return json({ error: 'invalid action' }, 400);
    }

    const name = String(body.name ?? '');
    const originalSize = Number(body.originalSize ?? 0);
    const compressedSize = Number(body.compressedSize ?? 0);
    const contentType = String(body.contentType ?? '');
    const contentBase64 = String(body.contentBase64 ?? '');

    if (!name || name.includes('..') || name.startsWith('/')) {
      return json({ success: false, action: 'failed', error: 'invalid object path' });
    }
    if (contentType !== 'image/webp') {
      return json({ success: false, action: 'failed', path: name, error: 'invalid content type' });
    }
    if (!Number.isFinite(originalSize) || !Number.isFinite(compressedSize) || originalSize <= 0 || compressedSize <= 0) {
      return json({ success: false, action: 'failed', path: name, error: 'invalid size metadata' });
    }
    if (compressedSize >= originalSize) {
      return json({ success: false, action: 'skipped_larger', path: name, originalSize, newSize: compressedSize });
    }
    if (!contentBase64) {
      return json({ success: false, action: 'failed', path: name, error: 'missing compressed payload' });
    }

    const metadata = await findObjectMetadata(admin, bucket, name);
    if (!metadata) {
      return json({ success: false, action: 'failed', path: name, error: 'object no longer exists' });
    }
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(metadata.mimetype)) {
      return json({ success: false, action: 'skipped_not_candidate', path: name, originalSize: metadata.size, newSize: metadata.size });
    }
    if (metadata.size !== originalSize) {
      return json({ success: false, action: 'failed', path: name, error: 'object changed since dry-run/list', originalSize: metadata.size, newSize: compressedSize });
    }

    const webpBytes = decodeBase64(contentBase64);
    if (webpBytes.byteLength !== compressedSize) {
      return json({ success: false, action: 'failed', path: name, error: 'payload size mismatch', originalSize, newSize: webpBytes.byteLength });
    }

    const { error: upErr } = await admin.storage.from(bucket).upload(name, webpBytes, {
      upsert: true,
      contentType: 'image/webp',
      cacheControl: '3600',
    });
    if (upErr) {
      return json({ success: false, action: 'failed', path: name, error: `upload failed: ${upErr.message}`, originalSize, newSize: compressedSize });
    }

    return json({ success: true, action: 'replaced', path: name, originalSize, newSize: compressedSize });
  } catch (err) {
    return json({
      error: err instanceof Error ? err.message : String(err),
    }, 500);
  }
});
