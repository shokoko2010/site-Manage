import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { env } from '../lib/env';

/**
 * Custom error classes
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(400, 'VALIDATION_ERROR', message, details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string, details?: any) {
    super(401, 'AUTHENTICATION_ERROR', message, details);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string, details?: any) {
    super(403, 'AUTHORIZATION_ERROR', message, details);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, details?: any) {
    super(404, 'NOT_FOUND', message, details);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(409, 'CONFLICT', message, details);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string, details?: any) {
    super(429, 'RATE_LIMIT_EXCEEDED', message, details);
    this.name = 'RateLimitError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: any) {
    super(500, 'DATABASE_ERROR', message, details);
    this.name = 'DatabaseError';
  }
}

export class ExternalServiceError extends AppError {
  constructor(message: string, details?: any) {
    super(502, 'EXTERNAL_SERVICE_ERROR', message, details);
    this.name = 'ExternalServiceError';
  }
}

/**
 * Error type guard
 */
export const isAppError = (error: any): error is AppError => {
  return error instanceof AppError;
};

/**
 * Error response formatter
 */
const formatErrorResponse = (error: AppError | Error, req: Request) => {
  const timestamp = new Date().toISOString();
  const requestId = req.headers['x-request-id'] || 'unknown';
  
  if (isAppError(error)) {
    return {
      error: {
        code: error.code,
        message: error.message,
        ...(error.details && { details: error.details }),
        timestamp,
        requestId,
        ...(env.NODE_ENV === 'development' && { stack: error.stack })
      }
    };
  }

  // For non-AppError instances
  return {
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: env.NODE_ENV === 'production' ? 'An unexpected error occurred' : error.message,
      timestamp,
      requestId,
      ...(env.NODE_ENV === 'development' && { stack: error.stack })
    }
  };
};

/**
 * Prisma error handler
 */
const handlePrismaError = (error: Prisma.PrismaClientKnownRequestError): AppError => {
  switch (error.code) {
    case 'P2002':
      return new ConflictError(
        'A record with this value already exists',
        {
          field: error.meta?.target,
          code: error.code
        }
      );
    
    case 'P2003':
      return new ConflictError(
        'Foreign key constraint failed',
        {
          field: error.meta?.field_name,
          code: error.code
        }
      );
    
    case 'P2025':
      return new NotFoundError(
        'Record not found',
        {
          code: error.code
        }
      );
    
    case 'P2001':
      return new ValidationError(
        'Invalid reference',
        {
          code: error.code
        }
      );
    
    case 'P2000':
      return new ValidationError(
        'Invalid input value',
        {
          code: error.code
        }
      );
    
    case 'P2004':
      return new AuthorizationError(
        'Constraint violation',
        {
          code: error.code
        }
      );
    
    case 'P2005':
      return new ValidationError(
        'Invalid value',
        {
          code: error.code
        }
      );
    
    case 'P2006':
      return new ValidationError(
        'Invalid value provided',
        {
          code: error.code
        }
      );
    
    case 'P2007':
      return new ValidationError(
        'Data validation error',
        {
          code: error.code
        }
      );
    
    case 'P2008':
      return new ValidationError(
        'Failed to parse query',
        {
          code: error.code
        }
      );
    
    case 'P2009':
      return new ValidationError(
        'Failed to validate query',
        {
          code: error.code
        }
      );
    
    case 'P2010':
      return new ValidationError(
        'Raw query failed',
        {
          code: error.code
        }
      );
    
    case 'P2011':
      return new ValidationError(
        'Null constraint violation',
        {
          code: error.code
        }
      );
    
    case 'P2012':
      return new ValidationError(
        'Missing a required value',
        {
          code: error.code
        }
      );
    
    case 'P2013':
      return new ValidationError(
        'Missing required argument',
        {
          code: error.code
        }
      );
    
    case 'P2014':
      return new ConflictError(
        'Constraint violation',
        {
          code: error.code
        }
      );
    
    case 'P2015':
      return new NotFoundError(
        'Record not found',
        {
          code: error.code
        }
      );
    
    case 'P2016':
      return new ValidationError(
        'Query interpretation error',
        {
          code: error.code
        }
      );
    
    case 'P2017':
      return new ValidationError(
        'Record connection error',
        {
          code: error.code
        }
      );
    
    case 'P2018':
      return new ValidationError(
        'Required connected record not found',
        {
          code: error.code
        }
      );
    
    case 'P2019':
      return new ValidationError(
        'Input error',
        {
          code: error.code
        }
      );
    
    case 'P2020':
      return new ValidationError(
        'Value out of range',
        {
          code: error.code
        }
      );
    
    case 'P2021':
      return new ValidationError(
        'Table does not exist',
        {
          code: error.code
        }
      );
    
    case 'P2022':
      return new ValidationError(
        'Column does not exist',
        {
          code: error.code
        }
      );
    
    case 'P2023':
      return new ValidationError(
        'Inconsistent column data',
        {
          code: error.code
        }
      );
    
    case 'P2024':
      return new DatabaseError(
        'Database connection timeout',
        {
          code: error.code
        }
      );
    
    case 'P2025':
      return new NotFoundError(
        'Operation failed because it depends on one or more records that were required but not found',
        {
          code: error.code
        }
      );
    
    case 'P2026':
      return new DatabaseError(
        'Current database provider does not support a feature',
        {
          code: error.code
        }
      );
    
    case 'P2027':
      return new DatabaseError(
        'Multiple errors occurred',
        {
          code: error.code
        }
      );
    
    case 'P2028':
      return new DatabaseError(
        'Transaction API error',
        {
          code: error.code
        }
      );
    
    case 'P2029':
      return new DatabaseError(
        'Query parameters limit exceeded',
        {
          code: error.code
        }
      );
    
    case 'P2030':
      return new DatabaseError(
        'Full-text search error',
        {
          code: error.code
        }
      );
    
    case 'P2031':
      return new DatabaseError(
        'Multiple database errors occurred',
        {
          code: error.code
        }
      );
    
    case 'P2032':
      return new DatabaseError(
        'Model not found',
        {
          code: error.code
        }
      );
    
    case 'P2033':
      return new ValidationError(
        'Number overflow error',
        {
          code: error.code
        }
      );
    
    case 'P2034':
      return new ConflictError(
        'Transaction conflict',
        {
          code: error.code
        }
      );
    
    case 'P2035':
      return new DatabaseError(
        'Database connection error',
        {
          code: error.code
        }
      );
    
    default:
      return new DatabaseError(
        'Database operation failed',
        {
          code: error.code,
          meta: error.meta
        }
      );
  }
};

/**
 * JWT error handler
 */
const handleJwtError = (error: any): AppError => {
  if (error.name === 'JsonWebTokenError') {
    return new AuthenticationError('Invalid token', { originalError: error.message });
  }
  
  if (error.name === 'TokenExpiredError') {
    return new AuthenticationError('Token expired', { originalError: error.message });
  }
  
  if (error.name === 'NotBeforeError') {
    return new AuthenticationError('Token not active yet', { originalError: error.message });
  }
  
  return new AuthenticationError('Authentication error', { originalError: error.message });
};

/**
 * Validation error handler
 */
const handleValidationError = (error: any): AppError => {
  if (error.name === 'ValidationError') {
    return new ValidationError(error.message, error.details);
  }
  
  if (error.name === 'CastError') {
    return new ValidationError('Invalid data type', { field: error.path, value: error.value });
  }
  
  return new ValidationError('Validation failed', { originalError: error.message });
};

/**
 * HTTP error handler
 */
const handleHttpError = (error: any): AppError => {
  if (error.response) {
    const status = error.response.status;
    const message = error.response.data?.message || error.message;
    
    switch (status) {
      case 400:
        return new ValidationError(message, { response: error.response.data });
      case 401:
        return new AuthenticationError(message, { response: error.response.data });
      case 403:
        return new AuthorizationError(message, { response: error.response.data });
      case 404:
        return new NotFoundError(message, { response: error.response.data });
      case 409:
        return new ConflictError(message, { response: error.response.data });
      case 429:
        return new RateLimitError(message, { response: error.response.data });
      case 500:
        return new DatabaseError(message, { response: error.response.data });
      case 502:
      case 503:
      case 504:
        return new ExternalServiceError(message, { response: error.response.data });
      default:
        return new AppError(status, 'HTTP_ERROR', message, { response: error.response.data });
    }
  }
  
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    return new ExternalServiceError('Service unavailable', { originalError: error.message });
  }
  
  if (error.code === 'ETIMEDOUT') {
    return new ExternalServiceError('Service timeout', { originalError: error.message });
  }
  
  return new ExternalServiceError('External service error', { originalError: error.message });
};

/**
 * Main error handling middleware
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log the error
  console.error(`[${new Date().toISOString()}] Error occurred:`, {
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    }
  });

  let appError: AppError;

  // Handle different types of errors
  if (isAppError(error)) {
    appError = error;
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    appError = handlePrismaError(error);
  } else if (error.name?.includes('JsonWebTokenError') || error.name?.includes('TokenExpiredError')) {
    appError = handleJwtError(error);
  } else if (error.name === 'ValidationError' || error.name === 'CastError') {
    appError = handleValidationError(error);
  } else if (error.response || error.code?.startsWith('E')) {
    appError = handleHttpError(error);
  } else {
    // Unknown error - wrap in generic AppError
    appError = new AppError(
      500,
      'INTERNAL_SERVER_ERROR',
      env.NODE_ENV === 'production' ? 'An unexpected error occurred' : error.message,
      { originalError: error.message }
    );
  }

  // Format and send response
  const statusCode = appError.statusCode;
  const response = formatErrorResponse(appError, req);

  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Send error response
  res.status(statusCode).json(response);
};

/**
 * 404 handler
 */
export const notFoundHandler = (req: Request, res: Response) => {
  const response = {
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.originalUrl} not found`,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || 'unknown'
    }
  };

  res.status(404).json(response);
};

/**
 * Async error wrapper
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Request timeout handler
 */
export const timeoutHandler = (req: Request, res: Response, next: NextFunction) => {
  res.setTimeout(30000, () => {
    const error = new AppError(408, 'REQUEST_TIMEOUT', 'Request timeout');
    next(error);
  });
  next();
};

/**
 * Unhandled promise rejection handler
 */
export const setupUnhandledRejectionHandler = () => {
  process.on('unhandledRejection', (reason: any, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    
    // In production, you might want to send this to an error tracking service
    if (env.NODE_ENV === 'production') {
      // Send to error tracking service like Sentry
      console.error('Unhandled rejection - would send to error tracking service');
    }
  });

  process.on('uncaughtException', (error: Error) => {
    console.error('Uncaught Exception:', error);
    
    // In production, you might want to gracefully shutdown
    if (env.NODE_ENV === 'production') {
      console.error('Uncaught exception - would gracefully shutdown');
      process.exit(1);
    }
  });
};

/**
 * Error monitoring middleware
 */
export const errorMonitoring = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Override res.end to track response time and status
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any) {
    const responseTime = Date.now() - startTime;
    
    // Log slow requests
    if (responseTime > 5000) {
      console.warn(`Slow request: ${req.method} ${req.originalUrl} - ${responseTime}ms`);
    }
    
    // Log error responses
    if (res.statusCode >= 400) {
      console.warn(`Error response: ${req.method} ${req.originalUrl} - ${res.statusCode}`);
    }
    
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};