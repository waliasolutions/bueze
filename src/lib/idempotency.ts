/**
 * Idempotency helpers for ensuring operations can be safely retried
 * without creating duplicate records or side effects.
 */

/**
 * Generate a unique request ID for idempotent operations
 */
export function generateRequestId(): string {
  // Format: req_<timestamp>_<random>
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `req_${timestamp}_${random}`;
}

/**
 * Store request ID in sessionStorage to track pending operations
 */
export function storeRequestId(operationKey: string, requestId: string): void {
  try {
    sessionStorage.setItem(`request_${operationKey}`, requestId);
  } catch (error) {
    console.warn('Failed to store request ID:', error);
  }
}

/**
 * Retrieve stored request ID for an operation
 */
export function getStoredRequestId(operationKey: string): string | null {
  try {
    return sessionStorage.getItem(`request_${operationKey}`);
  } catch (error) {
    console.warn('Failed to retrieve request ID:', error);
    return null;
  }
}

/**
 * Clear stored request ID after successful operation
 */
export function clearRequestId(operationKey: string): void {
  try {
    sessionStorage.removeItem(`request_${operationKey}`);
  } catch (error) {
    console.warn('Failed to clear request ID:', error);
  }
}

/**
 * Get or create request ID for an operation
 * Reuses existing ID if operation is still pending
 */
export function getOrCreateRequestId(operationKey: string): string {
  const existingId = getStoredRequestId(operationKey);
  
  if (existingId) {
    return existingId;
  }
  
  const newId = generateRequestId();
  storeRequestId(operationKey, newId);
  return newId;
}
