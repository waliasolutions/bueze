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
  FILE_UPLOAD = 'file_upload',
  FILE_TOO_LARGE = 'file_too_large',
  INVALID_FILE_TYPE = 'invalid_file_type',
  STORAGE_QUOTA = 'storage_quota',
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

  // File upload errors
  if (message.includes('file size') || message.includes('zu groß') || message.includes('3mb')) {
    return {
      category: ErrorCategory.FILE_TOO_LARGE,
      originalError: error,
      message: 'File size exceeds maximum allowed (3MB)',
      severity: 'low'
    };
  }

  if (message.includes('file type') || message.includes('dateityp') || message.includes('nicht erlaubt')) {
    return {
      category: ErrorCategory.INVALID_FILE_TYPE,
      originalError: error,
      message: 'Invalid file type. Only images allowed.',
      severity: 'low'
    };
  }

  if (message.includes('maximum') || message.includes('maximal') || message.includes('2 bilder')) {
    return {
      category: ErrorCategory.FILE_UPLOAD,
      originalError: error,
      message: 'Maximum number of files exceeded (2 images max)',
      severity: 'low'
    };
  }

  if (message.includes('storage') || message.includes('quota')) {
    return {
      category: ErrorCategory.STORAGE_QUOTA,
      originalError: error,
      message: 'Storage quota exceeded',
      severity: 'high'
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

  // RLS Policy violations
  if (message.includes('row-level security') || message.includes('rls') || message.includes('policy')) {
    return {
      category: ErrorCategory.RLS_POLICY,
      originalError: error,
      message: 'Row-level security policy violation',
      severity: 'high'
    };
  }

  // Race conditions
  if (message.includes('race') || message.includes('concurrent')) {
    return {
      category: ErrorCategory.RACE_CONDITION,
      originalError: error,
      message: 'Concurrent operation detected',
      severity: 'medium'
    };
  }

  // Duplicate key errors
  if (message.includes('duplicate') || message.includes('unique') || code === '23505') {
    return {
      category: ErrorCategory.DUPLICATE_KEY,
      originalError: error,
      message: 'Duplicate entry detected',
      severity: 'low'
    };
  }

  // Network errors
  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return {
      category: ErrorCategory.NETWORK,
      originalError: error,
      message: 'Network connection error',
      severity: 'medium'
    };
  }

  // Empty responses
  if (message.includes('empty') || message.includes('no data')) {
    return {
      category: ErrorCategory.FETCH_EMPTY,
      originalError: error,
      message: 'No data returned',
      severity: 'low'
    };
  }

  // Validation errors
  if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
    return {
      category: ErrorCategory.VALIDATION,
      originalError: error,
      message: 'Validation error',
      severity: 'low'
    };
  }

  // Default unknown error
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
