// Shared validation utilities - SSOT for form validation
// All validation logic should be centralized here

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

// Password validation constants
export const PASSWORD_MIN_LENGTH = 8;

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
 * Extract the 9 digits of a Swiss UID, or null when the input is not a UID.
 * Accepts every common spelling: CHE-123.456.789, CHE123456789, 123 456 789.
 */
export function uidDigits(value: string | null | undefined): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, '');
  return digits.length === 9 ? digits : null;
}

/** Whether the value is a complete Swiss UID. */
export function isValidUid(value: string | null | undefined): boolean {
  return uidDigits(value) !== null;
}

/**
 * Normalize Swiss UID input to the canonical CHE-123.456.789 form.
 * Inputs that are not a complete UID keep their text and only get the CHE
 * prefix uppercased, so partial entries are never silently mangled.
 * SSOT for every uid_number write.
 */
export function normalizeUid(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const digits = uidDigits(trimmed);
  if (digits) {
    return `CHE-${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  }

  return trimmed.replace(/^che[-\s]*/i, 'CHE-');
}

/**
 * Display-safe UID renderer. Returns the canonical `CHE-123.456.789` when a
 * full UID is present, otherwise the trimmed raw text (never null), and an
 * empty string when nothing usable is provided. SSOT for read-only UID cells.
 */
export function formatUidForDisplay(value: string | null | undefined): string {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  return normalizeUid(trimmed) ?? trimmed;
}
