// Shared SMTP2GO email sending utility for Edge Functions
// SSOT for all email sending operations

import { EMAIL_SENDER } from './siteConfig.ts';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  htmlBody?: string;
  textBody?: string;
}

export interface EmailResult {
  success: boolean;
  data?: unknown;
  error?: string;
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

/**
 * Send an email using SMTP2GO API with retry on transient failures.
 * Retries up to 3 times with exponential backoff (1s, 2s, 4s).
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

  const payload: Record<string, unknown> = {
    sender: EMAIL_SENDER,
    to: recipients,
    subject: options.subject,
  };

  if (options.htmlBody) {
    payload.html_body = options.htmlBody;
  }
  if (options.textBody) {
    payload.text_body = options.textBody;
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
          return {
            success: false,
            error: `Email sending failed: ${JSON.stringify(data)}`,
            data,
          };
        }
        // 5xx errors are transient — retry
        lastError = `Email sending failed (${response.status}): ${JSON.stringify(data)}`;
        console.warn(`SMTP2GO attempt ${attempt + 1}/${MAX_RETRIES + 1} failed:`, lastError);
      } else {
        console.log(`Email sent successfully to ${recipients.join(', ')}`);
        return { success: true, data };
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
  return { success: false, error: lastError || 'Email sending failed after retries' };
}

/**
 * Send multiple emails in parallel
 * @param emails - Array of email options
 * @returns Array of email results
 */
export async function sendEmails(emails: EmailOptions[]): Promise<EmailResult[]> {
  return Promise.all(emails.map(email => sendEmail(email)));
}
