export enum ErrorCategory {
  FETCH_TIMEOUT = 'fetch_timeout',
  FETCH_EMPTY = 'fetch_empty',
  AUTH_401 = 'auth_401',
  AUTH_403 = 'auth_403',
  RLS_POLICY = 'rls_policy',
  RACE_CONDITION = 'race_condition',
  DUPLICATE_KEY = 'duplicate_key',
  NETWORK = 'network',
  VALIDATION = 'validation',
  UNKNOWN = 'unknown'
}

export interface CategorizedError {
  category: ErrorCategory;
  originalError: any;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export const categorizeError = (error: any): CategorizedError => {
  const message = error?.message?.toLowerCase() || '';
  const code = error?.code;
  const status = error?.status;

  // Timeout errors
  if (message.includes('timeout') || message.includes('timed out')) {
    return {
      category: ErrorCategory.FETCH_TIMEOUT,
      originalError: error,
      message: 'Request timed out',
      severity: 'medium'
    };
  }

  // Auth errors
  if (message.includes('jwt') || code === '401' || status === 401 || message.includes('unauthorized')) {
    return {
      category: ErrorCategory.AUTH_401,
      originalError: error,
      message: 'Authentication required',
      severity: 'high'
    };
  }

  if (code === '403' || status === 403 || message.includes('forbidden')) {
    return {
      category: ErrorCategory.AUTH_403,
      originalError: error,
      message: 'Access forbidden',
      severity: 'high'
    };
  }

  // RLS policy violations
  if (message.includes('policy') || message.includes('row level security') || message.includes('rls')) {
    return {
      category: ErrorCategory.RLS_POLICY,
      originalError: error,
      message: 'Permission denied by security policy',
      severity: 'critical'
    };
  }

  // Duplicate key errors
  if (message.includes('duplicate key') || message.includes('unique constraint')) {
    return {
      category: ErrorCategory.DUPLICATE_KEY,
      originalError: error,
      message: 'Duplicate entry detected',
      severity: 'low'
    };
  }

  // Network errors
  if (message.includes('network') || message.includes('fetch failed') || message.includes('connection')) {
    return {
      category: ErrorCategory.NETWORK,
      originalError: error,
      message: 'Network connection error',
      severity: 'medium'
    };
  }

  // Empty fetch results (not always an error)
  if (message.includes('no rows') || message.includes('not found')) {
    return {
      category: ErrorCategory.FETCH_EMPTY,
      originalError: error,
      message: 'No data found',
      severity: 'low'
    };
  }

  // Validation errors
  if (message.includes('validation') || message.includes('invalid')) {
    return {
      category: ErrorCategory.VALIDATION,
      originalError: error,
      message: 'Validation failed',
      severity: 'medium'
    };
  }

  // Unknown errors
  return {
    category: ErrorCategory.UNKNOWN,
    originalError: error,
    message: error?.message || 'An unknown error occurred',
    severity: 'medium'
  };
};

// Track error frequency
const errorFrequency = new Map<ErrorCategory, number>();

export const trackError = (error: any): CategorizedError => {
  const categorized = categorizeError(error);
  
  // Increment frequency counter
  const currentCount = errorFrequency.get(categorized.category) || 0;
  errorFrequency.set(categorized.category, currentCount + 1);
  
  return categorized;
};

export const getErrorStats = () => {
  const stats = Array.from(errorFrequency.entries()).map(([category, count]) => ({
    category,
    count,
    percentage: 0
  }));
  
  const total = stats.reduce((sum, stat) => sum + stat.count, 0);
  
  return stats
    .map(stat => ({
      ...stat,
      percentage: total > 0 ? Math.round((stat.count / total) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count);
};
