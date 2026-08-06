// One-off support email dispatch (SMTP2GO). Content is fixed in code, no user input.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { sendEmail } from '../_shared/smtp2go.ts';

const TEXT = `Guten Tag Herr Mkrtchyan

Vielen Dank für Ihre Rückmeldung – sie hat uns sehr geholfen und wir konnten dank Ihrem Hinweis ein paar Spezial-Situationen finden und beheben.

Bitte versuchen Sie es jetzt nochmals unter «Profil bearbeiten» → «Dokumente & Bilder». Sollte weiterhin etwas nicht klappen, melden Sie sich einfach kurz – am besten gleich mit einem Beispiel-Bild, damit wir es gezielt nachstellen können.

Freundliche Grüsse
Büeze.ch GmbH
info@bueeze.ch`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const result = await sendEmail({
    to: 'info.mkrtchyan@artmultiservis.ch',
    bcc: 'info@walia-solutions.ch',
    subject: 'Ihr Hinweis – Problem behoben',
    textBody: TEXT,
    htmlBody: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#111">${TEXT.split('\n\n').map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('')}</div>`,
  });

  return new Response(JSON.stringify(result), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: result.success ? 200 : 500,
  });
});
