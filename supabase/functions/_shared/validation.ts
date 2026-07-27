/**
 * Shared validation utilities for edge functions.
 * Mirrors src/lib/validationHelpers.ts (SSOT split across Vite + Deno runtimes).
 */

/**
 * Extract the 9 digits of a Swiss UID, or null when the input is not a UID.
 * Accepts every common spelling: CHE-123.456.789, CHE123456789, 123 456 789.
 */
export function uidDigits(value: string | null | undefined): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, '');
  return digits.length === 9 ? digits : null;
}

/**
 * Normalize Swiss UID input to the canonical CHE-123.456.789 form.
 * Inputs that are not a complete UID keep their text and only get the CHE
 * prefix uppercased, so partial entries are never silently mangled.
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
