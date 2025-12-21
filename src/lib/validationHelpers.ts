// Shared validation utilities - SSOT for form validation
// All validation logic should be centralized here

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

// Password validation constants
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

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
  
  if (password.length > PASSWORD_MAX_LENGTH) {
    return { valid: false, error: `Passwort darf maximal ${PASSWORD_MAX_LENGTH} Zeichen lang sein` };
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
 * Validate email format
 * @param email - The email to validate
 * @returns ValidationResult with valid status and optional error message
 */
export function validateEmail(email: string): ValidationResult {
  if (!email) {
    return { valid: false, error: 'E-Mail-Adresse ist erforderlich' };
  }
  
  const trimmed = email.trim();
  
  // Basic email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Ungültige E-Mail-Adresse' };
  }
  
  // Check for common test/invalid patterns
  const invalidPatterns = ['test@test', 'example@example', 'asdf@', 'dummy@', 'abc@abc'];
  if (invalidPatterns.some(pattern => trimmed.toLowerCase().includes(pattern))) {
    return { valid: false, error: 'Diese E-Mail-Adresse ist nicht zulässig' };
  }
  
  return { valid: true };
}

/**
 * Validate Swiss phone number
 * @param phone - The phone number to validate
 * @returns ValidationResult with valid status and optional error message
 */
export function validateSwissPhone(phone: string): ValidationResult {
  if (!phone) {
    return { valid: false, error: 'Telefonnummer ist erforderlich' };
  }
  
  // Remove spaces, dashes, and other formatting
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  
  // Swiss phone numbers: +41 or 0 followed by 9 digits
  const swissPhoneRegex = /^(\+41|0041|0)[1-9][0-9]{8}$/;
  
  if (!swissPhoneRegex.test(cleaned)) {
    return { valid: false, error: 'Ungültige Schweizer Telefonnummer' };
  }
  
  return { valid: true };
}

/**
 * Validate Swiss postal code (PLZ)
 * @param postalCode - The postal code to validate
 * @returns ValidationResult with valid status and optional error message
 */
export function validateSwissPostalCode(postalCode: string): ValidationResult {
  if (!postalCode) {
    return { valid: false, error: 'PLZ ist erforderlich' };
  }
  
  const trimmed = postalCode.trim();
  
  // Swiss PLZ: 4 digits, starting with 1-9
  const plzRegex = /^[1-9][0-9]{3}$/;
  
  if (!plzRegex.test(trimmed)) {
    return { valid: false, error: 'Ungültige Schweizer PLZ (4 Ziffern)' };
  }
  
  return { valid: true };
}

/**
 * Validate name (first name or last name)
 * @param name - The name to validate
 * @param fieldLabel - Label for error messages (e.g., 'Vorname', 'Nachname')
 * @returns ValidationResult with valid status and optional error message
 */
export function validateName(name: string, fieldLabel: string = 'Name'): ValidationResult {
  if (!name) {
    return { valid: false, error: `${fieldLabel} ist erforderlich` };
  }
  
  const trimmed = name.trim();
  
  if (trimmed.length < 2) {
    return { valid: false, error: `${fieldLabel} muss mindestens 2 Zeichen lang sein` };
  }
  
  if (trimmed.length > 100) {
    return { valid: false, error: `${fieldLabel} darf maximal 100 Zeichen lang sein` };
  }
  
  // Check for invalid test patterns
  const invalidPatterns = ['test', 'asdf', 'dummy', 'example', 'aaa', 'zzz', 'xxx'];
  if (invalidPatterns.some(pattern => trimmed.toLowerCase() === pattern)) {
    return { valid: false, error: `Ungültiger ${fieldLabel}` };
  }
  
  return { valid: true };
}

/**
 * Validate company name
 * @param companyName - The company name to validate
 * @returns ValidationResult with valid status and optional error message
 */
export function validateCompanyName(companyName: string): ValidationResult {
  if (!companyName) {
    return { valid: false, error: 'Firmenname ist erforderlich' };
  }
  
  const trimmed = companyName.trim();
  
  if (trimmed.length < 2) {
    return { valid: false, error: 'Firmenname muss mindestens 2 Zeichen lang sein' };
  }
  
  if (trimmed.length > 200) {
    return { valid: false, error: 'Firmenname darf maximal 200 Zeichen lang sein' };
  }
  
  return { valid: true };
}
