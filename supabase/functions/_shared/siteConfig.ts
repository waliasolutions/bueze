// Shared site configuration for Edge Functions
// SSOT for URLs, email addresses, and site branding

export const FRONTEND_URL = Deno.env.get('FRONTEND_URL') || 'https://bueeze.ch';
export const SITE_NAME = 'Büeze.ch';
export const NOREPLY_EMAIL = 'noreply@bueeze.ch';
export const SUPPORT_EMAIL = 'info@bueeze.ch';
export const EMAIL_SENDER = `${SITE_NAME} <${NOREPLY_EMAIL}>`;
