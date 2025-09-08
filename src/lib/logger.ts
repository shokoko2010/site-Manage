import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { env } from './env';
import { mkdirSync, existsSync } from 'fs';
import { join } from 'path';

// Ensure logs directory exists
const logsDir = join(process.cwd(), 'logs');
if (!existsSync(logsDir)) {
  mkdirSync(logsDir, { recursive: true });
}

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    
    return msg;
  })
);

// Custom format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logger instance
export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: fileFormat,
  defaultMeta: {
    service: 'zex-content',
    environment: env.NODE_ENV,
  },
  transports: [
    // Error logs
    new DailyRotateFile({
      filename: join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '30d',
      maxSize: '20m',
      zippedArchive: true,
    }),
    
    // Combined logs
    new DailyRotateFile({
      filename: join(logsDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',
      maxSize: '20m',
      zippedArchive: true,
    }),
  ],
  exceptionHandlers: [
    new DailyRotateFile({
      filename: join(logsDir, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',
      maxSize: '20m',
      zippedArchive: true,
    }),
  ],
  rejectionHandlers: [
    new DailyRotateFile({
      filename: join(logsDir, 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',
      maxSize: '20m',
      zippedArchive: true,
    }),
  ],
});

// Add console transport for development
if (env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
    level: env.DEBUG_MODE ? 'debug' : 'info',
  }));
}

// HTTP request logger middleware
export const httpLogger = (req: any, res: any, next: any) => {
  const startTime = Date.now();
  
  // Log request
  logger.info('HTTP Request', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    requestId: req.headers['x-request-id'],
  });
  
  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk: any, encoding: any) {
    const responseTime = Date.now() - startTime;
    
    logger.info('HTTP Response', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime,
      requestId: req.headers['x-request-id'],
    });
    
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

// Authentication logger
export const authLogger = (event: string, data: any) => {
  logger.info('Auth Event', {
    event,
    ...data,
    timestamp: new Date().toISOString(),
  });
};

// Database operation logger
export const dbLogger = (operation: string, model: string, data: any) => {
  logger.debug('Database Operation', {
    operation,
    model,
    ...data,
    timestamp: new Date().toISOString(),
  });
};

// External API logger
export const apiLogger = (service: string, endpoint: string, method: string, data: any) => {
  logger.info('External API Call', {
    service,
    endpoint,
    method,
    ...data,
    timestamp: new Date().toISOString(),
  });
};

// Error logger
export const errorLogger = (error: any, context: any = {}) => {
  logger.error('Application Error', {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    context,
    timestamp: new Date().toISOString(),
  });
};

// Security event logger
export const securityLogger = (event: string, data: any) => {
  logger.warn('Security Event', {
    event,
    ...data,
    timestamp: new Date().toISOString(),
  });
};

// Performance logger
export const performanceLogger = (operation: string, duration: number, data: any) => {
  if (duration > 1000) { // Log slow operations
    logger.warn('Slow Operation', {
      operation,
      duration,
      ...data,
      timestamp: new Date().toISOString(),
    });
  } else {
    logger.debug('Performance Metric', {
      operation,
      duration,
      ...data,
      timestamp: new Date().toISOString(),
    });
  }
};

// Business event logger
export const businessLogger = (event: string, data: any) => {
  logger.info('Business Event', {
    event,
    ...data,
    timestamp: new Date().toISOString(),
  });
};

// Audit logger for compliance
export const auditLogger = (action: string, resource: string, userId: string, data: any) => {
  logger.info('Audit Log', {
    action,
    resource,
    userId,
    ...data,
    timestamp: new Date().toISOString(),
  });
};

// Health check logger
export const healthLogger = (service: string, status: string, data: any) => {
  logger.info('Health Check', {
    service,
    status,
    ...data,
    timestamp: new Date().toISOString(),
  });
};

// Request ID middleware
export const requestIdMiddleware = (req: any, res: any, next: any) => {
  const requestId = req.headers['x-request-id'] || generateRequestId();
  req.headers['x-request-id'] = requestId;
  res.setHeader('x-request-id', requestId);
  next();
};

// Generate unique request ID
function generateRequestId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Logger utility functions
export const logUtils = {
  // Log user activity
  logUserActivity: (userId: string, action: string, details: any) => {
    businessLogger('USER_ACTIVITY', {
      userId,
      action,
      details,
    });
  },

  // Log content operations
  logContentOperation: (operation: string, contentId: string, userId: string, details: any) => {
    auditLogger(operation, 'content', userId, {
      contentId,
      ...details,
    });
  },

  // Log site operations
  logSiteOperation: (operation: string, siteId: string, userId: string, details: any) => {
    auditLogger(operation, 'site', userId, {
      siteId,
      ...details,
    });
  },

  // Log authentication events
  logAuthEvent: (event: string, userId?: string, details: any = {}) => {
    authLogger(event, {
      userId,
      ...details,
    });
  },

  // Log security events
  logSecurityEvent: (event: string, severity: 'low' | 'medium' | 'high', details: any) => {
    securityLogger(event, {
      severity,
      ...details,
    });
  },

  // Log API calls
  logApiCall: (service: string, endpoint: string, method: string, success: boolean, duration: number, details: any) => {
    apiLogger(service, endpoint, method, {
      success,
      duration,
      ...details,
    });
  },

  // Log database queries
  logDbQuery: (operation: string, model: string, success: boolean, duration: number, details: any) => {
    dbLogger(operation, model, {
      success,
      duration,
      ...details,
    });
  },

  // Log performance metrics
  logPerformance: (operation: string, duration: number, threshold: number = 1000, details: any) => {
    performanceLogger(operation, duration, {
      threshold,
      ...details,
    });
  },
};

// Stream logger for real-time monitoring
export const streamLogger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Stream({
      stream: process.stdout,
    }),
  ],
});

// Export logger instance and utilities
export default logger;
export {
  httpLogger,
  authLogger,
  dbLogger,
  apiLogger,
  errorLogger,
  securityLogger,
  performanceLogger,
  businessLogger,
  auditLogger,
  healthLogger,
  requestIdMiddleware,
  logUtils,
  streamLogger,
};