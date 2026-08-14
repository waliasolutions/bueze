// One-off support email dispatch (SMTP2GO). Content is fixed in code, no user input.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { sendEmail } from '../_shared/smtp2go.ts';

const SIGNATURE = `Freundliche Grüsse
Ihr Büeze-Team
info@bueeze.ch`;

const CLIENT_TEXT = `Guten Tag Herr Erdmann

Ihre angenommene Offerte zum Auftrag «Kernbohrung 4x 160er Trocken» wurde storniert und der Auftrag wurde zurückgezogen.

Falls Sie später erneut Offerten möchten, können Sie den Auftrag jederzeit neu erfassen.

${SIGNATURE}`;

const HANDWERKER_TEXT = `Guten Tag Herr Al Housein

Der Kunde hat den Auftrag «Kernbohrung 4x 160er Trocken» zurückgezogen. Es besteht kein Interesse mehr an einer Ausführung.

Ihre Offerte wurde entsprechend geschlossen. Weitere Aufträge finden Sie jederzeit in Ihrem Büeze-Konto.

${SIGNATURE}`;

const toHtml = (text: string) =>
  `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#111">${text
    .split('\n\n')
    .map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`)
    .join('')}</div>`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const results = await Promise.all([
    sendEmail({
      to: 'manoloerdmann@gmail.com',
      bcc: 'info@walia-solutions.ch',
      subject: 'Ihr Auftrag «Kernbohrung 4x 160er Trocken» wurde storniert',
      textBody: CLIENT_TEXT,
      htmlBody: toHtml(CLIENT_TEXT),
    }),
    sendEmail({
      to: 'helveticbauservice@gmail.com',
      bcc: 'info@walia-solutions.ch',
      subject: 'Auftrag «Kernbohrung 4x 160er Trocken» zurückgezogen',
      textBody: HANDWERKER_TEXT,
      htmlBody: toHtml(HANDWERKER_TEXT),
    }),
  ]);

  const success = results.every((r) => r.success);

  return new Response(JSON.stringify({ success, results }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: success ? 200 : 500,
  });
});
