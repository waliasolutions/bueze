// Shared site configuration for Edge Functions
// Technical routing config only. Company data comes from billing_settings table via companyConfig.ts.

export const FRONTEND_URL = Deno.env.get('FRONTEND_URL') || 'https://bueeze.ch';
export const NOREPLY_EMAIL = 'noreply@bueeze.ch';
// SUPPORT_EMAIL kept for backward compat in existing email templates that reference it directly
export const SUPPORT_EMAIL = 'info@bueeze.ch';
// Formatted sender for SMTP2GO / Resend APIs
export const EMAIL_SENDER = 'Büeze.ch <noreply@bueeze.ch>';
