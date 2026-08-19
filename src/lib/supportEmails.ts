import { supabase } from '@/integrations/supabase/client';

/**
 * SSOT for manual support emails triggered by admins.
 * Uses the `send-support-email` edge function (SMTP2GO + Büeze CI `emailWrapper()`).
 */

/** Internal copy of every manual support mail. */
export const SUPPORT_BCC = 'info@walia-solutions.ch';

export interface AccessCredentialsEmailParams {
  userId: string;
  email: string;
  name?: string;
  password: string;
}

/**
 * Sends the "Zugang / Passwort" support mail with the freshly set password,
 * plus instructions how the user can reset it himself (link valid 1 hour).
 */
export async function sendAccessCredentialsEmail({
  userId,
  email,
  name,
  password,
}: AccessCredentialsEmailParams): Promise<void> {
  const greeting = name ? `Guten Tag ${name}` : 'Guten Tag';

  const { data, error } = await supabase.functions.invoke('send-support-email', {
    body: {
      to: email,
      bcc: SUPPORT_BCC,
      subject: 'Ihr Zugang zu Büeze.ch – Passwort und Anmeldung',
      heading: 'Ihr Zugang zu Büeze.ch',
      paragraphs: [
        greeting,
        'Vielen Dank für Ihre Geduld. Wir haben Ihren Zugang geprüft und für Sie ein Start-Passwort gesetzt, damit Sie sich sofort anmelden können.',
        'So melden Sie sich an:',
        `E-Mail: ${email}`,
        `Passwort: ${password}`,
        'Anmeldung: https://bueeze.ch/auth',
        'Dies ist ein Standard-Passwort. Sie können es jederzeit in Ihrem Profil ändern.',
        'Falls Sie das Passwort selbst zurücksetzen möchten:',
        'Öffnen Sie https://bueeze.ch/auth, klicken Sie auf «Passwort vergessen», geben Sie Ihre E-Mail-Adresse ein und öffnen Sie anschliessend den Link in der E-Mail. Bitte beachten Sie: Der Link ist nur 1 Stunde gültig. Danach müssen Sie einen neuen Link anfordern.',
        'Wir freuen uns auf Ihre Rückmeldung, ob die Anmeldung nun funktioniert. Bei Fragen erreichen Sie uns unter info@bueeze.ch. Bitte beachten Sie, dass technischer Support zurzeit nur auf Deutsch oder Englisch angeboten werden kann.',
        'Freundliche Grüsse',
        'Ihr Büeze.ch Team',
      ],
      // Same password for the same user on the same day is never sent twice.
      dedupeKey: `access-credentials:${userId}:${new Date().toISOString().slice(0, 10)}`,
    },
  });

  if (error) throw error;
  if (data?.error) throw new Error(typeof data.error === 'string' ? data.error : 'E-Mail konnte nicht gesendet werden.');
}
