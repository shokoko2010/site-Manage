import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import helmet from 'helmet';
import cors from 'cors';
import { env } from '../lib/env';
import { securityLogger } from '../lib/logger';

/**
 * Enhanced rate limiting configuration
 */
export const createRateLimiter = (options: {
  windowMs?: number;
  max?: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}) => {
  return rateLimit({
    windowMs: options.windowMs || env.RATE_LIMIT_WINDOW_MS,
    max: options.max || env.RATE_LIMIT_MAX_REQUESTS,
    message: options.message || {
      error: 'Too many requests',
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later.'
    },
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    skipFailedRequests: options.skipFailedRequests || false,
    keyGenerator: options.keyGenerator || ((req) => req.ip || req.connection.remoteAddress || 'unknown'),
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      securityLogger('RATE_LIMIT_EXCEEDED', {
        ip: req.ip,
        url: req.originalUrl,
        userAgent: req.get('User-Agent'),
      });
      
      res.status(429).json(options.message || {
        error: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP, please try again later.'
      });
    }
  });
};

/**
 * Authentication rate limiter (stricter limits)
 */
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.AUTH_RATE_LIMIT_MAX_REQUESTS, // 5 attempts per 15 minutes
  message: {
    error: 'Too many authentication attempts',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
    message: 'Too many authentication attempts. Please try again later.'
  },
  skipSuccessfulRequests: true, // Don't count successful requests
});

/**
 * API rate limiter
 */
export const apiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
});

/**
 * Strict rate limiter for sensitive operations
 */
export const strictRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour
  message: {
    error: 'Rate limit exceeded for sensitive operation',
    code: 'SENSITIVE_RATE_LIMIT_EXCEEDED',
    message: 'Too many attempts for this operation. Please try again later.'
  }
});

/**
 * Slow down middleware to prevent brute force attacks
 */
export const slowDownMiddleware = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 5, // Allow 5 requests per 15 minutes before slowing down
  delayMs: (hits) => hits * 100, // Add 100ms delay per request after 5
  maxDelayMs: 5000, // Maximum 5 seconds delay
  skipSuccessfulRequests: true,
  skipFailedRequests: false,
  keyGenerator: (req) => req.ip || req.connection.remoteAddress || 'unknown',
});

/**
 * Enhanced CORS configuration
 */
export const corsMiddleware = cors({
  origin: (origin, callback) => {
    const allowedOrigins = env.CORS_ORIGIN.split(',').map(o => o.trim());
    
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    // Check if the origin is allowed
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      securityLogger('CORS_VIOLATION', {
        origin,
        url: req.url,
      });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: env.CORS_CREDENTIALS,
  methods: env.CORS_METHODS.split(',').map(m => m.trim()),
  allowedHeaders: env.CORS_HEADERS.split(',').map(h => h.trim()),
  optionsSuccessStatus: 200,
  maxAge: 86400, // 24 hours
});

/**
 * Enhanced security headers with Helmet
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: env.HELMET_CSP_ENABLED ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'", "https:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      sandbox: ['allow-forms', 'allow-scripts', 'allow-same-origin'],
    },
  } : false,
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: 'same-site' },
  dnsPrefetchControl: true,
  expectCt: true,
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: env.NODE_ENV === 'production' ? {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  } : false,
  ieNoOpen: true,
  noSniff: true,
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
});

/**
 * Request size limiting middleware
 */
export const requestSizeLimit = (maxSize: number = env.MAX_FILE_SIZE) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = req.headers['content-length'];
    
    if (contentLength && parseInt(contentLength) > maxSize) {
      securityLogger('REQUEST_SIZE_EXCEEDED', {
        ip: req.ip,
        contentLength: parseInt(contentLength),
        maxSize,
        url: req.originalUrl,
      });
      
      return res.status(413).json({
        error: 'Request entity too large',
        code: 'REQUEST_TOO_LARGE',
        message: `Request size exceeds maximum allowed size of ${maxSize} bytes`
      });
    }
    
    next();
  };
};

/**
 * IP-based access control
 */
export const ipAccessControl = (allowedIPs: string[] = []) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    
    if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
      securityLogger('IP_ACCESS_DENIED', {
        ip: clientIP,
        url: req.originalUrl,
      });
      
      return res.status(403).json({
        error: 'Access denied',
        code: 'IP_ACCESS_DENIED',
        message: 'Your IP address is not allowed to access this resource.'
      });
    }
    
    next();
  };
};

/**
 * User agent validation
 */
export const userAgentValidation = (req: Request, res: Response, next: NextFunction) => {
  const userAgent = req.get('User-Agent');
  
  if (!userAgent) {
    securityLogger('MISSING_USER_AGENT', {
      ip: req.ip,
      url: req.originalUrl,
    });
    
    return res.status(400).json({
      error: 'Bad request',
      code: 'MISSING_USER_AGENT',
      message: 'User-Agent header is required.'
    });
  }
  
  // Block suspicious user agents
  const blockedAgents = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scanner/i,
    /test/i,
  ];
  
  if (blockedAgents.some(pattern => pattern.test(userAgent))) {
    securityLogger('BLOCKED_USER_AGENT', {
      ip: req.ip,
      userAgent,
      url: req.originalUrl,
    });
    
    return res.status(403).json({
      error: 'Access denied',
      code: 'BLOCKED_USER_AGENT',
      message: 'Access denied for this user agent.'
    });
  }
  
  next();
};

/**
 * Request ID middleware for tracking
 */
export const requestId = (req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] || 
                    req.headers['x-correlation-id'] || 
                    generateRequestId();
  
  req.headers['x-request-id'] = requestId;
  res.setHeader('x-request-id', requestId);
  
  next();
};

function generateRequestId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Security headers middleware
 */
export const additionalSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Remove sensitive headers
  res.removeHeader('X-Powered-By');
  
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'");
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  next();
};

/**
 * Session security middleware
 */
export const sessionSecurity = (req: Request, res: Response, next: NextFunction) => {
  // Set secure cookies
  res.cookie('session', 'secure', {
    secure: env.SESSION_SECURE_COOKIE,
    httpOnly: true,
    sameSite: env.SESSION_SAME_SITE,
    maxAge: env.SESSION_MAX_AGE,
  });
  
  // Add anti-CSRF token
  const csrfToken = generateCSRFToken();
  res.setHeader('X-CSRF-Token', csrfToken);
  
  next();
};

function generateCSRFToken(): string {
  return require('crypto').randomBytes(32).toString('hex');
}

/**
 * Request validation middleware
 */
export const requestValidation = (req: Request, res: Response, next: NextFunction) => {
  // Validate request method
  const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];
  if (!allowedMethods.includes(req.method)) {
    securityLogger('INVALID_METHOD', {
      method: req.method,
      ip: req.ip,
      url: req.originalUrl,
    });
    
    return res.status(405).json({
      error: 'Method not allowed',
      code: 'INVALID_METHOD',
      message: `${req.method} method is not allowed.`
    });
  }
  
  // Validate content type for POST/PUT/PATCH requests
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.get('Content-Type');
    if (!contentType || !contentType.includes('application/json')) {
      securityLogger('INVALID_CONTENT_TYPE', {
        method: req.method,
        contentType,
        ip: req.ip,
        url: req.originalUrl,
      });
      
      return res.status(415).json({
        error: 'Unsupported media type',
        code: 'INVALID_CONTENT_TYPE',
        message: 'Content-Type must be application/json.'
      });
    }
  }
  
  next();
};

/**
 * DDoS protection middleware
 */
export const ddosProtection = (req: Request, res: Response, next: NextFunction) => {
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  
  // Simple DDoS detection - can be enhanced with Redis
  const now = Date.now();
  const windowSize = 60 * 1000; // 1 minute
  const maxRequests = 100; // Max requests per minute
  
  // This would typically use Redis for distributed tracking
  // For now, we'll use a simple in-memory approach
  const requestCounts = (global as any).requestCounts || new Map();
  
  if (!requestCounts.has(clientIP)) {
    requestCounts.set(clientIP, []);
  }
  
  const requests = requestCounts.get(clientIP);
  const recentRequests = requests.filter((time: number) => now - time < windowSize);
  
  if (recentRequests.length >= maxRequests) {
    securityLogger('DDOS_DETECTED', {
      ip: clientIP,
      requestCount: recentRequests.length,
      windowSize,
      url: req.originalUrl,
    });
    
    return res.status(429).json({
      error: 'Too many requests',
      code: 'DDOS_PROTECTION',
      message: 'Your IP has been temporarily blocked due to excessive requests.'
    });
  }
  
  recentRequests.push(now);
  requestCounts.set(clientIP, recentRequests);
  
  next();
};

/**
 * Security middleware composer
 */
export const securityMiddleware = [
  requestId,
  userAgentValidation,
  requestValidation,
  requestSizeLimit(),
  ddosProtection,
  corsMiddleware,
  securityHeaders,
  additionalSecurityHeaders,
  sessionSecurity,
];

/**
 * Export all security middleware
 */
export {
  authRateLimiter,
  apiRateLimiter,
  strictRateLimiter,
  slowDownMiddleware,
  corsMiddleware,
  securityHeaders,
  requestSizeLimit,
  ipAccessControl,
  userAgentValidation,
  requestId,
  additionalSecurityHeaders,
  sessionSecurity,
  requestValidation,
  ddosProtection,
};