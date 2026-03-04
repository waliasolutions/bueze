/**
 * Shared error handling utilities for Edge Functions
 * SSOT for error message extraction across all functions
 */

/**
 * Safely extract an error message from an unknown error type.
 * Handles: standard Error instances, objects with .message (e.g. Supabase/Deno errors),
 * and completely unknown throws.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as any).message);
  }
  return 'Ein unerwarteter Fehler ist aufgetreten';
}
