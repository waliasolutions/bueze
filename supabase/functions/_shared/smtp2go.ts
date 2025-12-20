// Shared SMTP2GO email sending utility for Edge Functions
// SSOT for all email sending operations

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

/**
 * Send an email using SMTP2GO API
 * @param options - Email options
 * @returns EmailResult with success status and response data
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const apiKey = getSmtp2goApiKey();
  
  const recipients = Array.isArray(options.to) ? options.to : [options.to];
  
  const payload: Record<string, unknown> = {
    sender: 'noreply@bueeze.ch',
    to: recipients,
    subject: options.subject,
  };

  if (options.htmlBody) {
    payload.html_body = options.htmlBody;
  }
  if (options.textBody) {
    payload.text_body = options.textBody;
  }

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
      console.error('SMTP2GO email sending failed:', data);
      return {
        success: false,
        error: `Email sending failed: ${JSON.stringify(data)}`,
        data,
      };
    }

    console.log(`Email sent successfully to ${recipients.join(', ')}`);
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error sending email',
    };
  }
}

/**
 * Send multiple emails in parallel
 * @param emails - Array of email options
 * @returns Array of email results
 */
export async function sendEmails(emails: EmailOptions[]): Promise<EmailResult[]> {
  return Promise.all(emails.map(email => sendEmail(email)));
}
