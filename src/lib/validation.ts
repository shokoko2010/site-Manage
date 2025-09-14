import { z } from 'zod';

// Custom error class for validation errors
export class ValidationError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Common validation schemas
export const schemas = {
  // User schemas
  user: {
    register: z.object({
      username: z.string().min(3).max(50),
      email: z.string().email(),
      password: z.string().min(8),
      fullName: z.string().min(2).max(100),
    }),
    login: z.object({
      email: z.string().email(),
      password: z.string().min(1),
    }),
    update: z.object({
      username: z.string().min(3).max(50).optional(),
      email: z.string().email().optional(),
      fullName: z.string().min(2).max(100).optional(),
    }),
  },

  // Site schemas
  site: {
    create: z.object({
      name: z.string().min(1).max(100),
      url: z.string().url(),
      description: z.string().max(500).optional(),
      category: z.string().min(1).max(50),
    }),
    update: z.object({
      name: z.string().min(1).max(100).optional(),
      url: z.string().url().optional(),
      description: z.string().max(500).optional(),
      category: z.string().min(1).max(50).optional(),
    }),
  },

  // Content schemas
  content: {
    create: z.object({
      title: z.string().min(1).max(200),
      body: z.string().min(1),
      excerpt: z.string().max(500).optional(),
      status: z.enum(['draft', 'published', 'archived']).default('draft'),
      siteId: z.string().min(1),
      tags: z.array(z.string()).optional(),
    }),
    update: z.object({
      title: z.string().min(1).max(200).optional(),
      body: z.string().min(1).optional(),
      excerpt: z.string().max(500).optional(),
      status: z.enum(['draft', 'published', 'archived']).optional(),
      tags: z.array(z.string()).optional(),
    }),
  },

  // AI Enhancement schemas
  ai: {
    enhance: z.object({
      content: z.string().min(1),
      type: z.enum(['title', 'body', 'excerpt', 'tags']),
      tone: z.enum(['professional', 'casual', 'friendly', 'formal']).optional(),
      length: z.enum(['shorter', 'same', 'longer']).optional(),
    }),
    generate: z.object({
      prompt: z.string().min(1),
      type: z.enum(['title', 'body', 'excerpt', 'tags']),
      context: z.string().optional(),
      tone: z.enum(['professional', 'casual', 'friendly', 'formal']).optional(),
    }),
  },

  // Upload schemas
  upload: {
    image: z.object({
      file: z.instanceof(File),
      maxSize: z.number().default(5242880), // 5MB
      allowedTypes: z.array(z.string()).default(['image/jpeg', 'image/png', 'image/gif']),
    }),
    document: z.object({
      file: z.instanceof(File),
      maxSize: z.number().default(10485760), // 10MB
      allowedTypes: z.array(z.string()).default(['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
    }),
  },

  // General schemas
  pagination: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),

  search: z.object({
    query: z.string().min(1),
    filters: z.record(z.any()).optional(),
    pagination: z.object({
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(1).max(100).default(10),
    }).optional(),
  }),
};

// Validation helper functions
export function validateSchema<T>(schema: z.ZodSchema<T>, data: any): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      throw new ValidationError('Validation failed', { errors: formattedErrors });
    }
    throw error;
  }
}

// Safe validation (returns result instead of throwing)
export function safeValidate<T>(schema: z.ZodSchema<T>, data: any): { success: true; data: T } | { success: false; error: ValidationError } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      const validationError = new ValidationError('Validation failed', { errors: formattedErrors });
      return { success: false, error: validationError };
    }
    const validationError = new ValidationError('Unknown validation error');
    return { success: false, error: validationError };
  }
}

// Request validation middleware
export async function validateRequest<T>(schema: z.ZodSchema<T>, request: Request): Promise<T> {
  const contentType = request.headers.get('content-type');
  
  if (contentType?.includes('application/json')) {
    const data = await request.json();
    return validateSchema(schema, data);
  }
  
  if (contentType?.includes('application/x-www-form-urlencoded')) {
    const text = await request.text();
    return validateSchema(schema, Object.fromEntries(new URLSearchParams(text)));
  }
  
  throw new ValidationError('Invalid content type', { expected: 'application/json or application/x-www-form-urlencoded' });
}

// Query parameter validation
export function validateQueryParams<T>(schema: z.ZodSchema<T>, url: string): T {
  const searchParams = new URL(url).searchParams;
  const params: Record<string, string> = {};
  
  searchParams.forEach((value, key) => {
    params[key] = value;
  });
  
  return validateSchema(schema, params);
}

// File validation
export function validateFile(file: File, options: {
  maxSize?: number;
  allowedTypes?: string[];
  allowedExtensions?: string[];
}): void {
  const { maxSize = 5242880, allowedTypes = [], allowedExtensions = [] } = options;
  
  // Check file size
  if (file.size > maxSize) {
    throw new ValidationError(`File size exceeds maximum allowed size of ${maxSize} bytes`);
  }
  
  // Check file type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    throw new ValidationError(`File type ${file.type} is not allowed`);
  }
  
  // Check file extension
  if (allowedExtensions.length > 0) {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !allowedExtensions.includes(extension)) {
      throw new ValidationError(`File extension .${extension} is not allowed`);
    }
  }
}

// Email validation
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// URL validation
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Password strength validation
export function validatePassword(password: string): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  if (password.length < 8) {
    issues.push('Password must be at least 8 characters long');
  }
  
  if (!/[a-z]/.test(password)) {
    issues.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    issues.push('Password must contain at least one uppercase letter');
  }
  
  if (!/\d/.test(password)) {
    issues.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    issues.push('Password must contain at least one special character');
  }
  
  return {
    isValid: issues.length === 0,
    issues,
  };
}

// Sanitization functions
export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

export function sanitizeHtml(input: string): string {
  // Basic HTML sanitization - in production, use a library like DOMPurify
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');
}

// Array validation helpers
export function validateArray<T>(schema: z.ZodSchema<T>, array: T[]): T[] {
  return array.map(item => validateSchema(schema, item));
}

export function validateNonEmptyArray<T>(array: T[], message = 'Array cannot be empty'): T[] {
  if (!Array.isArray(array) || array.length === 0) {
    throw new ValidationError(message);
  }
  return array;
}

// Date validation
export function validateDate(date: string | Date): Date {
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    throw new ValidationError('Invalid date format');
  }
  return parsedDate;
}

export function validateDateRange(startDate: string | Date, endDate: string | Date): { start: Date; end: Date } {
  const start = validateDate(startDate);
  const end = validateDate(endDate);
  
  if (start > end) {
    throw new ValidationError('Start date must be before end date');
  }
  
  return { start, end };
}

// Number validation helpers
export function validateNumber(value: any, min?: number, max?: number): number {
  const num = Number(value);
  
  if (isNaN(num)) {
    throw new ValidationError('Invalid number format');
  }
  
  if (min !== undefined && num < min) {
    throw new ValidationError(`Number must be at least ${min}`);
  }
  
  if (max !== undefined && num > max) {
    throw new ValidationError(`Number must be at most ${max}`);
  }
  
  return num;
}

export function validatePositiveNumber(value: any): number {
  return validateNumber(value, 0);
}

// String validation helpers
export function validateNonEmptyString(value: any, fieldName = 'field'): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ValidationError(`${fieldName} cannot be empty`);
  }
  return value.trim();
}

export function validateStringLength(value: string, min?: number, max?: number, fieldName = 'field'): string {
  const trimmed = value.trim();
  
  if (min !== undefined && trimmed.length < min) {
    throw new ValidationError(`${fieldName} must be at least ${min} characters long`);
  }
  
  if (max !== undefined && trimmed.length > max) {
    throw new ValidationError(`${fieldName} must be at most ${max} characters long`);
  }
  
  return trimmed;
}

// Object validation helpers
export function validateRequiredFields(obj: any, requiredFields: string[]): void {
  const missingFields = requiredFields.filter(field => !obj[field]);
  
  if (missingFields.length > 0) {
    throw new ValidationError(`Missing required fields: ${missingFields.join(', ')}`);
  }
}

// Export all schemas and validation functions
export { z };

// Export specific schemas for direct import
export const loginSchema = schemas.user.login;
export const registerSchema = schemas.user.register;
export const siteCreateSchema = schemas.site.create;
export const siteUpdateSchema = schemas.site.update;
export const contentCreateSchema = schemas.content.create;
export const contentUpdateSchema = schemas.content.update;
export const aiEnhanceSchema = schemas.ai.enhance;
export const aiGenerateSchema = schemas.ai.generate;
export const paginationSchema = schemas.pagination;
export const searchSchema = schemas.search;