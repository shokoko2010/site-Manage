import { Request, Response, NextFunction } from 'express';
import { env, validateRequiredServices, validateOptionalServices } from '../lib/env';

/**
 * Middleware to validate environment configuration before starting the server
 */
export const validateEnvironment = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate required services
    const requiredServicesValid = validateRequiredServices();
    
    // Validate optional services
    validateOptionalServices();

    // Check for critical security issues
    const securityIssues: string[] = [];
    
    if (env.JWT_SECRET === 'your-super-secret-jwt-key-here-change-this-in-production') {
      securityIssues.push('JWT_SECRET is using default value - change this in production!');
    }

    if (env.SESSION_SECRET === 'your-session-secret-here') {
      securityIssues.push('SESSION_SECRET is using default value - change this in production!');
    }

    if (env.NODE_ENV === 'production' && env.SESSION_SECURE_COOKIE === false) {
      securityIssues.push('SESSION_SECURE_COOKIE should be true in production!');
    }

    if (env.NODE_ENV === 'production' && env.DEBUG_MODE === true) {
      securityIssues.push('DEBUG_MODE should be false in production!');
    }

    if (securityIssues.length > 0) {
      console.error('🚨 Security Issues Found:');
      securityIssues.forEach(issue => {
        console.error(`  ❌ ${issue}`);
      });
      
      if (env.NODE_ENV === 'production') {
        return res.status(500).json({
          error: 'Server configuration error',
          message: 'Server is not properly configured for production',
          issues: securityIssues
        });
      }
    }

    // Check database connection
    if (!env.DATABASE_URL) {
      const errorMsg = 'DATABASE_URL is not configured';
      console.error(`❌ ${errorMsg}`);
      return res.status(500).json({
        error: 'Configuration error',
        message: errorMsg
      });
    }

    // Log environment information
    console.log(`🌍 Environment: ${env.NODE_ENV}`);
    console.log(`🚀 Server running on port: ${env.PORT}`);
    console.log(`🔗 Frontend URL: ${env.FRONTEND_URL}`);
    console.log(`🗄️  Database: ${env.DATABASE_URL.split('@')[1]?.split('/')[0] || 'configured'}`);
    
    if (requiredServicesValid) {
      console.log('✅ All required services are configured');
    }

    next();
  } catch (error) {
    console.error('Environment validation error:', error);
    return res.status(500).json({
      error: 'Server configuration error',
      message: 'Failed to validate environment configuration'
    });
  }
};

/**
 * Middleware to check if required services are available
 */
export const checkServiceHealth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const healthStatus = {
      status: 'healthy',
      services: {
        database: 'unknown',
        redis: 'unknown',
        external_apis: 'unknown'
      },
      timestamp: new Date().toISOString()
    };

    // Check database health (will be implemented after database setup)
    try {
      // This will be implemented when we set up the database connection
      // await prisma.$queryRaw`SELECT 1`;
      healthStatus.services.database = 'healthy';
    } catch (error) {
      healthStatus.services.database = 'unhealthy';
      healthStatus.status = 'degraded';
    }

    // Check Redis health (if configured)
    if (env.REDIS_URL) {
      try {
        // This will be implemented when we set up Redis
        // await redis.ping();
        healthStatus.services.redis = 'healthy';
      } catch (error) {
        healthStatus.services.redis = 'unhealthy';
        healthStatus.status = 'degraded';
      }
    } else {
      healthStatus.services.redis = 'not_configured';
    }

    // Check external APIs health
    if (env.GEMINI_API_KEY) {
      healthStatus.services.external_apis = 'configured';
    } else {
      healthStatus.services.external_apis = 'not_configured';
    }

    // Attach health status to request for other middleware to use
    req.healthStatus = healthStatus;

    next();
  } catch (error) {
    console.error('Service health check error:', error);
    return res.status(500).json({
      error: 'Service health check failed',
      message: 'Failed to check service health'
    });
  }
};

/**
 * Middleware to ensure secure configuration in production
 */
export const ensureSecureConfig = (req: Request, res: Response, next: NextFunction) => {
  if (env.NODE_ENV === 'production') {
    const securityWarnings: string[] = [];

    // Check for insecure configurations
    if (env.DEBUG_MODE) {
      securityWarnings.push('Debug mode is enabled in production');
    }

    if (env.SESSION_SECURE_COOKIE === false) {
      securityWarnings.push('Session cookies are not secure in production');
    }

    if (env.JWT_SECRET.length < 64) {
      securityWarnings.push('JWT secret is too short for production');
    }

    if (env.BCRYPT_ROUNDS < 12) {
      securityWarnings.push('BCrypt rounds should be at least 12 in production');
    }

    if (securityWarnings.length > 0) {
      console.warn('🚨 Production Security Warnings:');
      securityWarnings.forEach(warning => {
        console.warn(`  ⚠️  ${warning}`);
      });
    }
  }

  next();
};

/**
 * Middleware to validate request size limits
 */
export const validateRequestSize = (req: Request, res: Response, next: NextFunction) => {
  const contentLength = req.headers['content-length'];
  const maxSize = env.MAX_FILE_SIZE;

  if (contentLength && parseInt(contentLength) > maxSize) {
    return res.status(413).json({
      error: 'Request entity too large',
      message: `Request size exceeds maximum allowed size of ${maxSize} bytes`
    });
  }

  next();
};

/**
 * Middleware to validate file types
 */
export const validateFileType = (req: Request, res: Response, next: NextFunction) => {
  if (req.file) {
    const allowedTypes = env.ALLOWED_FILE_TYPES.split(',');
    const fileExtension = req.file.originalname.split('.').pop()?.toLowerCase();

    if (!fileExtension || !allowedTypes.includes(fileExtension)) {
      return res.status(415).json({
        error: 'Unsupported media type',
        message: `File type .${fileExtension} is not supported. Allowed types: ${allowedTypes.join(', ')}`
      });
    }
  }

  next();
};

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      healthStatus?: {
        status: string;
        services: {
          database: string;
          redis: string;
          external_apis: string;
        };
        timestamp: string;
      };
    }
  }
}