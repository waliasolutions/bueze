// One-off support email dispatch (SMTP2GO, Büeze-CI). Content is fixed in code, no user input.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { sendEmail } from '../_shared/smtp2go.ts';
import { emailWrapper } from '../_shared/emailTemplates.ts';

const SUBJECT = 'Konto vorhanden – Passwort zurücksetzen | Büeze.ch';

const TO = 'info.mkrtchyan@artmultiservis.ch';
const BCC = 'info@walia-solutions.ch';

const TEXT_BODY = `Sehr geehrter Herr Mkrtchyan,

Ihr Konto bei Büeze.ch besteht bereits und ist freigegeben – eine neue Registrierung ist nicht nötig.

Wir haben Ihnen eine E-Mail mit einem Link zum Zurücksetzen Ihres Passworts geschickt. Bitte setzen Sie Ihr Passwort direkt dort.

Schritt 1: Link öffnen
Klicken Sie auf den Reset-Link in der E-Mail, die Sie von uns erhalten haben.

Schritt 2: Neues Passwort wählen
Setzen Sie auf der geöffneten Seite Ihr neues Passwort.

Schritt 3: Frist beachten
Bitte erledigen Sie dies bis Dienstag, 18. August um 08:00 Uhr.

Unterstützung
Falls Sie Hilfe brauchen, können wir Sie zwischen Montag und Freitag kurz anrufen. Bitte geben Sie uns dazu 1–2 mögliche Zeiten an.

Freundliche Grüsse
Ihr Büeze.ch Team
info@bueeze.ch`;

const HTML_BODY = emailWrapper(`
  <div class="content">
    <h2>Konto vorhanden – Passwort zurücksetzen</h2>
    <p>Sehr geehrter Herr Mkrtchyan,</p>
    <p>Ihr Konto bei Büeze.ch besteht bereits und ist freigegeben – eine neue Registrierung ist nicht nötig.</p>
    <p>Wir haben Ihnen eine E-Mail mit einem Link zum Zurücksetzen Ihres Passworts geschickt. Bitte setzen Sie Ihr Passwort direkt dort.</p>

    <h3>Schritt 1: Link öffnen</h3>
    <p>Klicken Sie auf den Reset-Link in der E-Mail, die Sie von uns erhalten haben.</p>

    <h3>Schritt 2: Neues Passwort wählen</h3>
    <p>Setzen Sie auf der geöffneten Seite Ihr neues Passwort.</p>

    <h3>Schritt 3: Frist beachten</h3>
    <p>Bitte erledigen Sie dies bis Dienstag, 18. August um 08:00 Uhr.</p>

    <h3>Unterstützung</h3>
    <p>Falls Sie Hilfe brauchen, können wir Sie zwischen Montag und Freitag kurz anrufen. Bitte geben Sie uns dazu 1–2 mögliche Zeiten an.</p>

    <p>Freundliche Grüsse<br>Ihr Büeze.ch Team<br>info@bueeze.ch</p>
  </div>
`);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const result = await sendEmail({
    to: TO,
    bcc: BCC,
    subject: SUBJECT,
    textBody: TEXT_BODY,
    htmlBody: HTML_BODY,
  });

  return new Response(JSON.stringify(result), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: result.success ? 200 : 500,
  });
});
