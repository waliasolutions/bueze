// Shared validation utilities - SSOT for form validation
// All validation logic should be centralized here

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

// Password validation constants
export const PASSWORD_MIN_LENGTH = 8;

// Lead quality constants - shared by SubmitLead and EditLead
export const DESCRIPTION_MIN_LENGTH = 50;

/**
 * Validate password strength
 * @param password - The password to validate
 * @returns ValidationResult with valid status and optional error message
 */
export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { valid: false, error: 'Passwort ist erforderlich' };
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    return { valid: false, error: `Passwort muss mindestens ${PASSWORD_MIN_LENGTH} Zeichen lang sein` };
  }

  if (password.length > 128) {
    return { valid: false, error: 'Passwort darf maximal 128 Zeichen lang sein' };
  }

  // Check for at least one letter and one number for better security
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  if (!hasLetter || !hasNumber) {
    return { valid: false, error: 'Passwort muss mindestens einen Buchstaben und eine Zahl enthalten' };
  }

  return { valid: true };
}

/**
 * Normalize Swiss UID input: trim, uppercase the CHE prefix
 * (tolerating any whitespace between CHE and digits), null when empty.
 * SSOT for every uid_number write.
 */
export function normalizeUid(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.replace(/^che[-\s]*/i, 'CHE-');
}
