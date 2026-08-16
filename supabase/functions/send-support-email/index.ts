// Manual/support email dispatch. Admin-only, Büeze CI, mandatory dedupe key.
// Duplicate sends are impossible: the dedupe key is locked in public.email_send_log.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'https://esm.sh/zod@3.23.8';
import { sendEmail } from '../_shared/smtp2go.ts';
import { emailWrapper } from '../_shared/emailTemplates.ts';
import { createSupabaseAdmin } from '../_shared/supabaseClient.ts';
import { getErrorMessage } from '../_shared/errorUtils.ts';

const BodySchema = z.object({
  to: z.string().email(),
  bcc: z.string().email().optional(),
  subject: z.string().min(3).max(200),
  heading: z.string().min(3).max(200),
  // Plain text paragraphs. Lines ending with ':' are rendered as step headings.
  paragraphs: z.array(z.string().min(1).max(2000)).min(1).max(30),
  dedupeKey: z.string().min(8).max(200),
});

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  });

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createSupabaseAdmin();

  try {
    // --- Admin-only: validate caller JWT in code (verify_jwt = false) ---
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) return json({ error: 'Nicht angemeldet.' }, 401);

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) return json({ error: 'Nicht angemeldet.' }, 401);

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id);

    const isAdmin = (roles ?? []).some((r) => r.role === 'admin' || r.role === 'super_admin');
    if (!isAdmin) return json({ error: 'Keine Berechtigung.' }, 403);

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return json({ error: parsed.error.flatten().fieldErrors }, 400);
    }
    const { to, bcc, subject, heading, paragraphs, dedupeKey } = parsed.data;

    const htmlParagraphs = paragraphs
      .map((p) => {
        const safe = escapeHtml(p);
        return p.trim().endsWith(':') || p.trim().startsWith('Schritt ')
          ? `<h3>${safe.replace(/:$/, '')}</h3>`
          : `<p>${safe.replace(/\n/g, '<br>')}</p>`;
      })
      .join('\n');

    const result = await sendEmail({
      to,
      bcc,
      subject,
      textBody: paragraphs.join('\n\n'),
      htmlBody: emailWrapper(`
        <div class="content">
          <h2>${escapeHtml(heading)}</h2>
          ${htmlParagraphs}
        </div>
      `),
      dedupeKey,
      context: 'support_manual',
    });

    if (result.skipped) {
      return json({ success: true, skipped: true, message: 'Bereits versendet – kein zweiter Versand.' }, 200);
    }

    return json(result, result.success ? 200 : 502);
  } catch (error) {
    console.error('send-support-email failed:', error);
    return json({ error: getErrorMessage(error) }, 500);
  }
});
