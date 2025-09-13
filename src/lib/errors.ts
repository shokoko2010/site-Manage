/**
 * Centralized Error Handling System
 * Provides consistent error handling across the application
 */

export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
    public details?: any,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super('VALIDATION_ERROR', message, 400, details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed', details?: any) {
    super('AUTH_ERROR', message, 401, details);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions', details?: any) {
    super('AUTHORIZATION_ERROR', message, 403, details);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', details?: any) {
    super('NOT_FOUND', message, 404, details);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict', details?: any) {
    super('CONFLICT_ERROR', message, 409, details);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', details?: any) {
    super('RATE_LIMIT_ERROR', message, 429, details);
    this.name = 'RateLimitError';
  }
}

export class ExternalServiceError extends AppError {
  constructor(message: string = 'External service error', details?: any) {
    super('EXTERNAL_SERVICE_ERROR', message, 502, details);
    this.name = 'ExternalServiceError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database error', details?: any) {
    super('DATABASE_ERROR', message, 500, details);
    this.name = 'DatabaseError';
  }
}

/**
 * Error codes mapping for better error handling
 */
export const ErrorCodes = {
  // Authentication & Authorization
  AUTH_ERROR: 'AUTH_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  ACCOUNT_DISABLED: 'ACCOUNT_DISABLED',
  
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  
  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT_ERROR: 'CONFLICT_ERROR',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  
  // Rate limiting
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
  
  // External services
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  TIMEOUT: 'TIMEOUT',
  
  // Database
  DATABASE_ERROR: 'DATABASE_ERROR',
  CONNECTION_ERROR: 'CONNECTION_ERROR',
  QUERY_ERROR: 'QUERY_ERROR',
  
  // System errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  FILE_UPLOAD_ERROR: 'FILE_UPLOAD_ERROR',
} as const;

/**
 * Handle API errors and convert them to appropriate AppError instances
 */
export function handleApiError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  // Handle Prisma errors
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as any;
    
    switch (prismaError.code) {
      case 'P2002':
        return new ConflictError('Resource already exists', prismaError.meta);
      case 'P2003':
        return new ValidationError('Foreign key constraint failed', prismaError.meta);
      case 'P2025':
        return new NotFoundError('Record not found', prismaError.meta);
      case 'P1001':
        return new DatabaseError('Database connection failed', prismaError.meta);
      default:
        return new DatabaseError('Database operation failed', prismaError);
    }
  }

  // Handle JWT errors
  if (error && typeof error === 'object' && 'name' in error) {
    const jwtError = error as any;
    
    if (jwtError.name === 'JsonWebTokenError') {
      return new AuthenticationError('Invalid token');
    }
    
    if (jwtError.name === 'TokenExpiredError') {
      return new AuthenticationError('Token expired');
    }
  }

  // Handle Zod validation errors
  if (error && typeof error === 'object' && 'issues' in error) {
    const zodError = error as any;
    return new ValidationError('Validation failed', zodError.issues);
  }

  // Handle network errors
  if (error && typeof error === 'object' && 'code' in error) {
    const networkError = error as any;
    
    if (networkError.code === 'ECONNREFUSED' || networkError.code === 'ENOTFOUND') {
      return new ExternalServiceError('Service unavailable', networkError);
    }
    
    if (networkError.code === 'ETIMEDOUT') {
      return new ExternalServiceError('Request timeout', networkError);
    }
  }

  // Default fallback
  console.error('Unhandled error:', error);
  return new AppError(
    'INTERNAL_ERROR',
    'An unexpected error occurred',
    500,
    error instanceof Error ? error.stack : undefined
  );
}

/**
 * Format error for API response
 */
export function formatErrorForResponse(error: AppError) {
  const response: any = {
    error: {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
    },
  };

  // Include details only in development or if explicitly allowed
  if (process.env.NODE_ENV === 'development' || error.details) {
    response.error.details = error.details;
  }

  return response;
}

/**
 * Create error response for Next.js API routes
 */
export function createErrorResponse(error: AppError) {
  const formattedError = formatErrorForResponse(error);
  return new Response(JSON.stringify(formattedError), {
    status: error.statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Async error handler wrapper for API routes
 */
export function withErrorHandling(
  handler: (request: Request, context?: any) => Promise<Response>
) {
  return async (request: Request, context?: any): Promise<Response> => {
    try {
      return await handler(request, context);
    } catch (error) {
      const appError = handleApiError(error);
      
      // Log the error
      logError(appError, request);
      
      return createErrorResponse(appError);
    }
  };
}

/**
 * Logging function for errors
 */
export function logError(error: AppError, request?: Request) {
  const logData = {
    timestamp: new Date().toISOString(),
    error: {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      details: error.details,
      stack: error.stack,
    },
    request: request ? {
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries()),
    } : null,
  };

  // In production, you might want to send this to a logging service
  if (process.env.NODE_ENV === 'production') {
    console.error(JSON.stringify(logData));
  } else {
    console.error('Error occurred:', logData);
  }
}

/**
 * Client-side error handler for React components
 */
export function useErrorHandler() {
  const handleError = (error: unknown, fallbackMessage?: string) => {
    const appError = handleApiError(error);
    
    // In a real app, you might want to show a toast notification
    console.error('Client error:', appError);
    
    // You could also send the error to an error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Send to error tracking service
      reportErrorToService(appError);
    }
    
    return {
      message: fallbackMessage || appError.message,
      code: appError.code,
      statusCode: appError.statusCode,
    };
  };

  return { handleError };
}

/**
 * Report error to external service (placeholder for Sentry, etc.)
 */
function reportErrorToService(error: AppError) {
  // Implement error reporting to external services like Sentry
  // This is a placeholder implementation
  if (typeof window !== 'undefined') {
    // Client-side error reporting
    console.warn('Error reporting not implemented:', error);
  }
}

/**
 * Type guard for AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Type guard for specific error types
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

export function isAuthenticationError(error: unknown): error is AuthenticationError {
  return error instanceof AuthenticationError;
}

export function isAuthorizationError(error: unknown): error is AuthorizationError {
  return error instanceof AuthorizationError;
}

export function isNotFoundError(error: unknown): error is NotFoundError {
  return error instanceof NotFoundError;
}

export function isConflictError(error: unknown): error is ConflictError {
  return error instanceof ConflictError;
}

export function isRateLimitError(error: unknown): error is RateLimitError {
  return error instanceof RateLimitError;
}

export function isExternalServiceError(error: unknown): error is ExternalServiceError {
  return error instanceof ExternalServiceError;
}

export function isDatabaseError(error: unknown): error is DatabaseError {
  return error instanceof DatabaseError;
}