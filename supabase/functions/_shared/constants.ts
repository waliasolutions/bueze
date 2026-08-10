// Synchronized constants - mirror of src/lib/validationHelpers.ts
// Frontend & edge functions are separate deployments.
// If you change PASSWORD_MIN_LENGTH here, also change it in src/lib/validationHelpers.ts.
export const PASSWORD_MIN_LENGTH = 8;

// Grace period after signup during which auth.users.updated_at may still equal created_at
// without indicating a stuck account. Used by bulk password reset detection.
export const ONBOARDING_GRACE_PERIOD_MINUTES = 5;

// SSOT: internal/test accounts. Incidents caused by these accounts are reported
// by e-mail only (no admin_notifications entry), see reportPayrexxIncident().
export const INTERNAL_TEST_ACCOUNT_DOMAINS = ['walia-solutions.ch'];
export const INTERNAL_TEST_ACCOUNT_EMAILS = ['amit.walia@gmx.ch'];

/** Where test/internal incident reports are sent. */
export const INTERNAL_INCIDENT_EMAIL = 'info@walia-solutions.ch';

export function isInternalTestEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  if (INTERNAL_TEST_ACCOUNT_EMAILS.includes(normalized)) return true;
  return INTERNAL_TEST_ACCOUNT_DOMAINS.some((d) => normalized.endsWith(`@${d}`));
}
