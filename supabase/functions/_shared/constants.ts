// Synchronized constants - mirror of src/lib/validationHelpers.ts
// Frontend & edge functions are separate deployments.
// If you change PASSWORD_MIN_LENGTH here, also change it in src/lib/validationHelpers.ts.
export const PASSWORD_MIN_LENGTH = 8;

// Grace period after signup during which auth.users.updated_at may still equal created_at
// without indicating a stuck account. Used by bulk password reset detection.
export const ONBOARDING_GRACE_PERIOD_MINUTES = 5;
