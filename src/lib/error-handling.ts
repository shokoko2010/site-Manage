// Centralized Error Handling System

export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public details?: any,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
    this.stack = new Error().stack;
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      statusCode: this.statusCode
    };
  }
}

// Error codes
export const ErrorCodes = {
  // Authentication errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  
  // Authorization errors
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  RESOURCE_LIMIT_EXCEEDED: 'RESOURCE_LIMIT_EXCEEDED',
  
  // Database errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  QUERY_FAILED: 'QUERY_FAILED',
  
  // External service errors
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  
  // Business logic errors
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
  INVALID_STATE: 'INVALID_STATE',
  
  // Generic errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

// Error handler utility functions
export const handleApiError = (error: unknown): AppError => {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    // Handle specific error types
    if (error.name === 'ValidationError') {
      return new AppError(
        ErrorCodes.VALIDATION_ERROR,
        'Validation failed',
        error.message,
        400
      );
    }

    if (error.name === 'UnauthorizedError' || error.message.includes('unauthorized')) {
      return new AppError(
        ErrorCodes.UNAUTHORIZED,
        'Unauthorized access',
        error.message,
        401
      );
    }

    if (error.name === 'ForbiddenError' || error.message.includes('forbidden')) {
      return new AppError(
        ErrorCodes.FORBIDDEN,
        'Access forbidden',
        error.message,
        403
      );
    }

    if (error.name === 'NotFoundError' || error.message.includes('not found')) {
      return new AppError(
        ErrorCodes.NOT_FOUND,
        'Resource not found',
        error.message,
        404
      );
    }

    // Generic error
    return new AppError(
      ErrorCodes.INTERNAL_ERROR,
      'An unexpected error occurred',
      error.message,
      500
    );
  }

  // Unknown error type
  return new AppError(
    ErrorCodes.UNKNOWN_ERROR,
    'An unknown error occurred',
    error,
    500
  );
};

export const createValidationError = (message: string, details?: any): AppError => {
  return new AppError(
    ErrorCodes.VALIDATION_ERROR,
    message,
    details,
    400
  );
};

export const createUnauthorizedError = (message: string = 'Unauthorized access'): AppError => {
  return new AppError(
    ErrorCodes.UNAUTHORIZED,
    message,
    undefined,
    401
  );
};

export const createForbiddenError = (message: string = 'Access forbidden'): AppError => {
  return new AppError(
    ErrorCodes.FORBIDDEN,
    message,
    undefined,
    403
  );
};

export const createNotFoundError = (resource: string): AppError => {
  return new AppError(
    ErrorCodes.NOT_FOUND,
    `${resource} not found`,
    undefined,
    404
  );
};

export const createConflictError = (message: string): AppError => {
  return new AppError(
    ErrorCodes.RESOURCE_CONFLICT,
    message,
    undefined,
    409
  );
};

// Async error wrapper for API routes
export const asyncHandler = <T extends any[], R>(
  fn: (...args: T) => Promise<R>
): ((...args: T) => Promise<R>) => {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      const appError = handleApiError(error);
      throw appError;
    }
  };
};

// Logging utility
export const logError = (error: unknown, context?: any): void => {
  const timestamp = new Date().toISOString();
  const appError = handleApiError(error);
  
  const errorLog = {
    timestamp,
    level: 'error',
    code: appError.code,
    message: appError.message,
    details: appError.details,
    stack: appError.stack,
    context
  };

  console.error(JSON.stringify(errorLog, null, 2));
};

// Client-side error handler
export const handleClientError = (error: unknown, showToast?: (message: string, type: 'success' | 'error' | 'info') => void): void => {
  const appError = handleApiError(error);
  
  // Log the error
  logError(error);
  
  // Show user-friendly message
  if (showToast) {
    const userMessage = getUserFriendlyMessage(appError.code);
    showToast(userMessage, 'error');
  }
};

// User-friendly error messages
const getUserFriendlyMessage = (code: string): string => {
  const messages: Record<string, string> = {
    [ErrorCodes.UNAUTHORIZED]: 'Please log in to continue',
    [ErrorCodes.FORBIDDEN]: 'You don\'t have permission to perform this action',
    [ErrorCodes.NOT_FOUND]: 'The requested resource was not found',
    [ErrorCodes.VALIDATION_ERROR]: 'Please check your input and try again',
    [ErrorCodes.RESOURCE_LIMIT_EXCEEDED]: 'You have reached the limit for your plan',
    [ErrorCodes.NETWORK_ERROR]: 'Network error. Please check your connection',
    [ErrorCodes.EXTERNAL_SERVICE_ERROR]: 'Service temporarily unavailable',
    [ErrorCodes.INTERNAL_ERROR]: 'Something went wrong. Please try again',
    [ErrorCodes.UNKNOWN_ERROR]: 'An unexpected error occurred'
  };

  return messages[code] || 'An error occurred. Please try again';
};

// Error boundary fallback component helper
export const getErrorFallbackMessage = (error: unknown): { title: string; description: string } => {
  const appError = handleApiError(error);
  
  const fallbackMessages: Record<string, { title: string; description: string }> = {
    [ErrorCodes.UNAUTHORIZED]: {
      title: 'Authentication Required',
      description: 'Please log in to access this feature'
    },
    [ErrorCodes.FORBIDDEN]: {
      title: 'Access Denied',
      description: 'You don\'t have permission to view this content'
    },
    [ErrorCodes.NOT_FOUND]: {
      title: 'Page Not Found',
      description: 'The page you\'re looking for doesn\'t exist'
    },
    [ErrorCodes.NETWORK_ERROR]: {
      title: 'Connection Error',
      description: 'Please check your internet connection and try again'
    },
    [ErrorCodes.INTERNAL_ERROR]: {
      title: 'Something Went Wrong',
      description: 'We\'re experiencing technical difficulties. Please try again later'
    }
  };

  return fallbackMessages[appError.code] || {
    title: 'Unexpected Error',
    description: 'An unexpected error occurred. Please refresh the page and try again'
  };
};