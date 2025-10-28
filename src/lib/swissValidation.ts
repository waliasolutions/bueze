/**
 * Swiss-specific validation utilities for business registration
 */

/**
 * Validates Swiss UID (Unternehmens-Identifikationsnummer)
 * Format: CHE-###.###.###
 */
export const validateUID = (uid: string): boolean => {
  if (!uid) return false;
  return /^CHE-\d{3}\.\d{3}\.\d{3}$/.test(uid);
};

/**
 * Validates Swiss MWST (Mehrwertsteuer) number
 * Format: CHE-###.###.### MWST
 */
export const validateMWST = (mwst: string): boolean => {
  if (!mwst) return true; // Optional field
  return /^CHE-\d{3}\.\d{3}\.\d{3}\s+MWST$/.test(mwst);
};

/**
 * Validates Swiss IBAN
 * Format: CH## #### #### #### #### #
 */
export const validateIBAN = (iban: string): boolean => {
  if (!iban) return false;
  const cleaned = iban.replace(/\s/g, '');
  return /^CH\d{19}$/.test(cleaned);
};

/**
 * Formats IBAN with spaces for better readability
 */
export const formatIBAN = (iban: string): string => {
  const cleaned = iban.replace(/\s/g, '').toUpperCase();
  return cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
};

/**
 * Formats UID number with proper punctuation
 */
export const formatUID = (uid: string): string => {
  const cleaned = uid.replace(/[^0-9]/g, '');
  if (cleaned.length !== 9) return uid;
  return `CHE-${cleaned.substring(0, 3)}.${cleaned.substring(3, 6)}.${cleaned.substring(6, 9)}`;
};

/**
 * Validates Swiss phone number
 * Accepts: +41, 0041, or 0 prefix
 */
export const validateSwissPhone = (phone: string): boolean => {
  if (!phone) return false;
  const cleaned = phone.replace(/\s/g, '');
  return /^(\+41|0041|0)\d{9}$/.test(cleaned);
};

/**
 * Formats Swiss phone number
 */
export const formatSwissPhone = (phone: string): string => {
  const cleaned = phone.replace(/\s/g, '');
  if (cleaned.startsWith('+41')) {
    const number = cleaned.substring(3);
    return `+41 ${number.substring(0, 2)} ${number.substring(2, 5)} ${number.substring(5, 7)} ${number.substring(7, 9)}`;
  }
  if (cleaned.startsWith('0')) {
    return `${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6, 8)} ${cleaned.substring(8, 10)}`;
  }
  return phone;
};

/**
 * Validates Swiss postal code (4 digits)
 */
export const validateSwissPostalCode = (zip: string): boolean => {
  return /^\d{4}$/.test(zip);
};
