// Shared SMTP2GO email sending utility for Edge Functions
// SSOT for all email sending operations (incl. duplicate-send lock)

import { EMAIL_SENDER } from './siteConfig.ts';
import { createSupabaseAdmin } from './supabaseClient.ts';

export interface EmailAttachment {
  filename: string;
  fileblob: string; // base64 encoded content
  mimetype: string;
}

export interface EmailOptions {
  to: string | string[];
  bcc?: string | string[];
  subject: string;
  htmlBody?: string;
  textBody?: string;
  attachments?: EmailAttachment[];
  /**
   * Durable send lock. If an entry with this key already exists in
   * public.email_send_log, the mail is NOT sent again.
   * When omitted, a key is derived from recipient + subject + body hash
   * within a 10 minute window (accidental double-send protection).
   */
  dedupeKey?: string;
  /** Optional label for the admin email log (e.g. 'support_manual'). */
  context?: string;
}

export interface EmailResult {
  success: boolean;
  data?: unknown;
  error?: string;
  /** true when the send was blocked because the same mail already went out */
  skipped?: boolean;
  dedupeKey?: string;
}


/**
 * Get SMTP2GO API key from environment
 * @throws Error if API key is not configured
 */
export function getSmtp2goApiKey(): string {
  const apiKey = Deno.env.get('SMTP2GO_API_KEY');
  if (!apiKey) {
    throw new Error('SMTP2GO_API_KEY not configured');
  }
  return apiKey;
}

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // exponential backoff
const AUTO_DEDUPE_WINDOW_MS = 10 * 60 * 1000;

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

async function buildAutoDedupeKey(recipients: string[], options: EmailOptions): Promise<string> {
  const bodyHash = await sha256Hex(`${options.subject}|${options.htmlBody ?? ''}|${options.textBody ?? ''}`);
  const window = Math.floor(Date.now() / AUTO_DEDUPE_WINDOW_MS);
  return `auto:${recipients.slice().sort().join(',')}:${bodyHash.slice(0, 32)}:${window}`;
}

/**
 * Reserve the send in public.email_send_log. The unique index on dedupe_key is
 * the lock: only the first caller wins, every later caller is a duplicate.
 */
async function reserveSend(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  dedupeKey: string,
  recipients: string[],
  options: EmailOptions,
): Promise<'reserved' | 'duplicate'> {
  const { error } = await supabase.from('email_send_log').insert({
    dedupe_key: dedupeKey,
    recipient: recipients.join(', '),
    bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc) : null,
    subject: options.subject,
    status: 'pending',
    context: options.context ?? null,
  });

  if (!error) return 'reserved';

  // 23505 = unique violation -> same mail already reserved/sent/failed
  if ((error as { code?: string }).code === '23505') {
    const { data: existing } = await supabase
      .from('email_send_log')
      .select('status')
      .eq('dedupe_key', dedupeKey)
      .maybeSingle();

    // A previously failed send may be retried; sent/pending is a duplicate.
    if (existing?.status === 'failed') {
      await supabase
        .from('email_send_log')
        .update({ status: 'pending', error_detail: null })
        .eq('dedupe_key', dedupeKey);
      return 'reserved';
    }
    return 'duplicate';
  }

  // Logging must never block a real send.
  console.warn('email_send_log reservation failed (sending anyway):', error.message);
  return 'reserved';
}


async function finalizeSend(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  dedupeKey: string,
  status: 'sent' | 'failed',
  extra: { smtp2go_email_id?: string | null; error_detail?: string | null },
) {
  try {
    await supabase
      .from('email_send_log')
      .update({ status, ...extra })
      .eq('dedupe_key', dedupeKey);
  } catch (e) {
    console.warn('email_send_log finalize failed:', e);
  }
}

/**
 * Send an email using SMTP2GO API with retry on transient failures.
 * Retries up to 3 times with exponential backoff (1s, 2s, 4s).
 * Duplicate sends are blocked via the durable dedupe lock (see EmailOptions.dedupeKey).
 * @param options - Email options
 * @returns EmailResult with success status and response data
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const apiKey = getSmtp2goApiKey();

  const recipients = Array.isArray(options.to) ? options.to : [options.to];

  // Basic email format validation
  for (const email of recipients) {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      console.error(`Invalid email address: ${email}`);
      return { success: false, error: `Ungültige E-Mail-Adresse: ${email}` };
    }
  }

  const dedupeKey = options.dedupeKey ?? (await buildAutoDedupeKey(recipients, options));

  let supabase: ReturnType<typeof createSupabaseAdmin> | null = null;
  try {
    supabase = createSupabaseAdmin();
  } catch (e) {
    console.warn('email_send_log unavailable (no admin client), sending without lock:', e);
  }

  if (supabase) {
    const reservation = await reserveSend(supabase, dedupeKey, recipients, options);
    if (reservation === 'duplicate') {
      console.log(`Duplicate send blocked for key ${dedupeKey} (${recipients.join(', ')})`);
      return { success: true, skipped: true, dedupeKey };
    }
  }


  const payload: Record<string, unknown> = {
    sender: EMAIL_SENDER,
    to: recipients,
    subject: options.subject,
  };

  if (options.bcc) {
    payload.bcc = Array.isArray(options.bcc) ? options.bcc : [options.bcc];
  }
  if (options.htmlBody) {
    payload.html_body = options.htmlBody;
  }
  if (options.textBody) {
    payload.text_body = options.textBody;
  }
  if (options.attachments && options.attachments.length > 0) {
    payload.attachments = options.attachments;
  }

  let lastError: string | undefined;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch('https://api.smtp2go.com/v3/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Smtp2go-Api-Key': apiKey,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        // 4xx errors are permanent — don't retry
        if (response.status >= 400 && response.status < 500) {
          console.error('SMTP2GO email sending failed (permanent):', data);
          const error = `Email sending failed: ${JSON.stringify(data)}`;
          if (supabase) await finalizeSend(supabase, dedupeKey, 'failed', { error_detail: error });
          return { success: false, error, data, dedupeKey };
        }
        // 5xx errors are transient — retry
        lastError = `Email sending failed (${response.status}): ${JSON.stringify(data)}`;
        console.warn(`SMTP2GO attempt ${attempt + 1}/${MAX_RETRIES + 1} failed:`, lastError);
      } else {
        console.log(`Email sent successfully to ${recipients.join(', ')}`);
        const emailId = (data as { data?: { email_id?: string } })?.data?.email_id ?? null;
        if (supabase) await finalizeSend(supabase, dedupeKey, 'sent', { smtp2go_email_id: emailId });
        return { success: true, data, dedupeKey };
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error sending email';
      console.warn(`SMTP2GO attempt ${attempt + 1}/${MAX_RETRIES + 1} error:`, lastError);
    }

    // Wait before retrying (skip delay after last attempt)
    if (attempt < MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[attempt]));
    }
  }

  console.error(`SMTP2GO email sending failed after ${MAX_RETRIES + 1} attempts:`, lastError);
  const finalError = lastError || 'Email sending failed after retries';
  if (supabase) await finalizeSend(supabase, dedupeKey, 'failed', { error_detail: finalError });
  return { success: false, error: finalError, dedupeKey };
}


/**
 * Send multiple emails in parallel
 * @param emails - Array of email options
 * @returns Array of email results
 */
export async function sendEmails(emails: EmailOptions[]): Promise<EmailResult[]> {
  return Promise.all(emails.map(email => sendEmail(email)));
}
