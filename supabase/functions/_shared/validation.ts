/**
 * Shared validation utilities for edge functions.
 * Mirrors src/lib/validationHelpers.ts (SSOT split across Vite + Deno runtimes).
 */

/**
 * Normalize Swiss UID input: trim, uppercase the CHE prefix
 * (tolerating any whitespace between CHE and digits), null when empty.
 */
export function normalizeUid(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.replace(/^che[-\s]*/i, 'CHE-');
}
