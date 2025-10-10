import { logWithCorrelation, captureException } from './errorTracking';
import { trackError } from './errorCategories';

/**
 * Exponential backoff with jitter configuration
 */
interface RetryConfig {
  maxAttempts?: number;
  baseDelay?: number; // in ms
  maxDelay?: number; // in ms
  timeout?: number; // in ms
}

const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxAttempts: 4,
  baseDelay: 250,
  maxDelay: 2000,
  timeout: 10000, // 10 seconds
};

/**
 * Calculate exponential backoff delay with jitter
 */
function calculateBackoff(attempt: number, baseDelay: number, maxDelay: number): number {
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  const cappedDelay = Math.min(exponentialDelay, maxDelay);
  // Add jitter: random value between 0 and cappedDelay
  const jitter = Math.random() * cappedDelay;
  return jitter;
}

/**
 * Sleep for a given duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch with timeout using AbortController
 */
async function fetchWithTimeout<T>(
  fetchFn: () => Promise<T>,
  timeout: number
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const result = await fetchFn();
    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

/**
 * Unified fetch wrapper with retry, timeout, and exponential backoff
 */
export async function fetchWithRetry<T>(
  fetchFn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const {
    maxAttempts,
    baseDelay,
    maxDelay,
    timeout
  } = { ...DEFAULT_RETRY_CONFIG, ...config };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      logWithCorrelation(`Fetch attempt ${attempt + 1}/${maxAttempts}`);
      
      const result = await fetchWithTimeout(fetchFn, timeout);
      
      if (attempt > 0) {
        logWithCorrelation(`Fetch succeeded after ${attempt + 1} attempts`);
      }
      
      return result;
    } catch (error) {
      lastError = error as Error;
      const categorized = trackError(error);
      
      logWithCorrelation(`Fetch attempt ${attempt + 1} failed`, {
        error: categorized.message,
        category: categorized.category
      });

      // Don't retry on certain errors
      if (
        categorized.category === 'auth_401' ||
        categorized.category === 'auth_403' ||
        categorized.category === 'validation'
      ) {
        logWithCorrelation('Non-retryable error, aborting retry loop');
        throw error;
      }

      // If this was the last attempt, throw
      if (attempt === maxAttempts - 1) {
        captureException(lastError, {
          context: 'fetchWithRetry',
          attempts: maxAttempts,
          category: categorized.category
        });
        throw lastError;
      }

      // Wait before retrying with exponential backoff + jitter
      const backoffDelay = calculateBackoff(attempt, baseDelay, maxDelay);
      logWithCorrelation(`Retrying in ${Math.round(backoffDelay)}ms...`);
      await sleep(backoffDelay);
    }
  }

  // This should never be reached, but TypeScript requires it
  throw lastError || new Error('Fetch failed');
}

/**
 * Supabase query wrapper with retry logic
 */
export async function supabaseQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  config?: RetryConfig
): Promise<T> {
  return fetchWithRetry(async () => {
    const { data, error } = await queryFn();
    
    if (error) {
      throw error;
    }
    
    if (data === null) {
      throw new Error('No data returned from query');
    }
    
    return data;
  }, config);
}

/**
 * Pagination helper
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

export function calculatePagination(params: PaginationParams) {
  const { page, pageSize } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  
  return { from, to };
}

export function buildPaginatedResult<T>(
  data: T[],
  totalCount: number,
  params: PaginationParams
): PaginatedResult<T> {
  const { page, pageSize } = params;
  const totalPages = Math.ceil(totalCount / pageSize);
  const hasMore = page < totalPages;
  
  return {
    data,
    totalCount,
    page,
    pageSize,
    totalPages,
    hasMore
  };
}
