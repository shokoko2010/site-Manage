import { z } from 'zod';

// Environment variables schema
const envSchema = z.object({
  // Server Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),

  // Database Configuration
  DATABASE_URL: z.string().url(),

  // Authentication & Security
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_ROUNDS: z.coerce.number().min(8).max(16).default(12),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  AUTH_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(5),

  // External APIs
  GEMINI_API_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().optional(),

  // Email Configuration
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),

  // File Upload Configuration
  MAX_FILE_SIZE: z.coerce.number().default(10485760),
  UPLOAD_PATH: z.string().default('./uploads'),
  ALLOWED_FILE_TYPES: z.string().default('jpg,jpeg,png,gif,pdf,doc,docx'),

  // Logging Configuration
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FILE: z.string().default('./logs/app.log'),
  ERROR_LOG_FILE: z.string().default('./logs/error.log'),

  // Redis Configuration
  REDIS_URL: z.string().url().optional(),
  REDIS_TTL: z.coerce.number().default(300),

  // Analytics & Monitoring
  ENABLE_ANALYTICS: z.coerce.boolean().default(true),
  ANALYTICS_PROVIDER: z.string().default('custom'),
  SENTRY_DSN: z.string().optional(),

  // Security Headers
  HELMET_CSP_ENABLED: z.coerce.boolean().default(true),
  HELMET_CSP_DIRECTIVES: z.string().default("default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'"),

  // CORS Configuration
  CORS_ORIGIN: z.string().default('http://localhost:3000,http://localhost:3001'),
  CORS_CREDENTIALS: z.coerce.boolean().default(true),
  CORS_METHODS: z.string().default('GET,POST,PUT,DELETE,PATCH,OPTIONS'),
  CORS_HEADERS: z.string().default('Content-Type,Authorization,X-Requested-With'),

  // Session Configuration
  SESSION_SECRET: z.string().min(32),
  SESSION_MAX_AGE: z.coerce.number().default(604800000),
  SESSION_SECURE_COOKIE: z.coerce.boolean().default(false),
  SESSION_SAME_SITE: z.enum(['strict', 'lax', 'none']).default('lax'),

  // Backup Configuration
  BACKUP_ENABLED: z.coerce.boolean().default(true),
  BACKUP_SCHEDULE: z.string().default('0 2 * * *'),
  BACKUP_RETENTION_DAYS: z.coerce.number().default(30),
  BACKUP_PATH: z.string().default('./backups'),

  // Development Settings
  DEBUG_MODE: z.coerce.boolean().default(false),
  ENABLE_DEV_TOOLS: z.coerce.boolean().default(false),
  MOCK_EXTERNAL_APIS: z.coerce.boolean().default(false),
});

// Validate environment variables
function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      error.errors.forEach((err) => {
        console.error(`  ${err.path.join('.')}: ${err.message}`);
      });
      console.error('\nPlease check your .env file and ensure all required variables are set correctly.');
      process.exit(1);
    }
    throw error;
  }
}

// Export validated environment variables
export const env = validateEnv();

// Export types for environment variables
export type Environment = z.infer<typeof envSchema>;

// Helper function to check if we're in development
export const isDevelopment = env.NODE_ENV === 'development';

// Helper function to check if we're in production
export const isProduction = env.NODE_ENV === 'production';

// Helper function to check if we're in testing
export const isTesting = env.NODE_ENV === 'test';

// Helper function to get CORS origins as array
export const getCorsOrigins = (): string[] => {
  return env.CORS_ORIGIN.split(',').map(origin => origin.trim());
};

// Helper function to get allowed file types as array
export const getAllowedFileTypes = (): string[] => {
  return env.ALLOWED_FILE_TYPES.split(',').map(type => type.trim());
};

// Helper function to validate required services
export const validateRequiredServices = () => {
  const missingServices: string[] = [];

  if (!env.DATABASE_URL) {
    missingServices.push('Database');
  }

  if (!env.GEMINI_API_KEY) {
    missingServices.push('Gemini AI');
  }

  if (missingServices.length > 0) {
    console.warn(`⚠️  Missing required services: ${missingServices.join(', ')}`);
    console.warn('Some features may not work properly.');
  }

  return missingServices.length === 0;
};

// Helper function to validate optional services
export const validateOptionalServices = () => {
  const availableServices: string[] = [];

  if (env.REDIS_URL) {
    availableServices.push('Redis');
  }

  if (env.SENTRY_DSN) {
    availableServices.push('Sentry');
  }

  if (env.OPENAI_API_KEY) {
    availableServices.push('OpenAI');
  }

  if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
    availableServices.push('Email');
  }

  if (availableServices.length > 0) {
    console.log(`✅ Available optional services: ${availableServices.join(', ')}`);
  }

  return availableServices;
};

// Export all helpers
export {
  isDevelopment,
  isProduction,
  isTesting,
  getCorsOrigins,
  getAllowedFileTypes,
  validateRequiredServices,
  validateOptionalServices,
};