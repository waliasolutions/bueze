/**
 * Display Formatters — SSOT for phone, URL, and address presentation
 * 
 * Pure functions for consistent UI rendering across all components.
 * Swiss-specific logic is defensive: only normalizes when the number
 * is eindeutig Swiss (+41, 0041, or local 0[1-9]x format).
 */

/**
 * Detect if a digit string represents a Swiss phone number.
 * 
 * @param raw - The original trimmed input (may contain +, spaces, etc.)
 * @param digits - Only-digit version of the input
 */
function isSwissNumber(raw: string, digits: string): boolean {
  // +41... or 0041... → digits start with "41" (after stripping + or 00)
  if (raw.startsWith('+41')) return true;
  if (raw.startsWith('0041')) return true;
  // Local format: 0[1-9]X... (10 digits total, e.g. 0791234567)
  if (/^0[1-9]\d{8}$/.test(digits)) return true;
  return false;
}

/**
 * Extract the 9-digit Swiss subscriber number from various input formats.
 * Assumes isSwissNumber() already returned true.
 */
function extractSwissSubscriber(raw: string, digits: string): string {
  if (raw.startsWith('+41')) {
    // digits = "41XXXXXXXXX" → subscriber is everything after "41"
    return digits.slice(2);
  }
  if (raw.startsWith('0041')) {
    // digits = "0041XXXXXXXXX" → subscriber after "0041"
    return digits.slice(4);
  }
  // Local format 0XXXXXXXXX → subscriber after leading 0
  return digits.slice(1);
}

/**
 * Format a phone number for display.
 * 
 * Swiss numbers → `+41 XX XXX XX XX`
 * Non-Swiss → trimmed original (no transformation)
 * Empty/null → `''`
 */
export function formatPhoneDisplay(phone: string | null | undefined): string {
  if (!phone) return '';
  const trimmed = phone.trim();
  if (!trimmed) return '';

  const digits = trimmed.replace(/\D/g, '');

  if (isSwissNumber(trimmed, digits)) {
    const subscriber = extractSwissSubscriber(trimmed, digits);
    if (subscriber.length === 9) {
      // Format as +41 XX XXX XX XX
      return `+41 ${subscriber.slice(0, 2)} ${subscriber.slice(2, 5)} ${subscriber.slice(5, 7)} ${subscriber.slice(7, 9)}`;
    }
  }

  // Non-Swiss or unrecognized format → return trimmed original
  return trimmed;
}

/**
 * Format a phone number for a `tel:` href.
 * 
 * Swiss numbers → `tel:+41XXXXXXXXX`
 * Non-Swiss → `tel:` + digits only
 * Empty/null → `''`
 */
export function formatPhoneHref(phone: string | null | undefined): string {
  if (!phone) return '';
  const trimmed = phone.trim();
  if (!trimmed) return '';

  const digits = trimmed.replace(/\D/g, '');

  if (isSwissNumber(trimmed, digits)) {
    const subscriber = extractSwissSubscriber(trimmed, digits);
    if (subscriber.length === 9) {
      return `tel:+41${subscriber}`;
    }
  }

  // Non-Swiss: use + prefix if original had it, otherwise just digits
  if (trimmed.startsWith('+')) {
    return `tel:+${digits}`;
  }
  return `tel:${digits}`;
}

/**
 * Ensure a website URL has a protocol prefix.
 * 
 * - Empty → `''`
 * - Already has `http://` or `https://` → as-is
 * - Otherwise → prepend `https://`
 */
export function formatWebsiteUrl(url: string | null | undefined): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

/**
 * Format a Swiss address for display.
 * 
 * Output: `Strasse, PLZ Ort (Kanton)`
 * Gracefully handles missing parts.
 */
export function formatAddress(parts: {
  street?: string | null;
  zip?: string | null;
  city?: string | null;
  canton?: string | null;
}): string {
  const { street, zip, city, canton } = parts;
  
  const locationParts = [zip, city].filter(Boolean).join(' ');
  const segments: string[] = [];
  
  if (street) segments.push(street);
  if (locationParts) segments.push(locationParts);
  if (canton) segments.push(`(${canton})`);
  
  return segments.join(', ');
}
