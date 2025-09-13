/**
 * Centralized Input Validation System
 * Provides Zod schemas for validating all API inputs
 */

import { z } from 'zod';
import { ValidationError } from './errors';

// Common validation patterns
const emailSchema = z.string().email('Invalid email address');
const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');
const usernameSchema = z.string().min(3, 'Username must be at least 3 characters').max(20, 'Username must be at most 20 characters');
const nameSchema = z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be at most 50 characters');
const urlSchema = z.string().url('Invalid URL');
const uuidSchema = z.string().uuid('Invalid UUID');

// Authentication schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: emailSchema,
  username: usernameSchema,
  password: passwordSchema,
  name: nameSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// User schemas
export const updateUserSchema = z.object({
  name: nameSchema.optional(),
  username: usernameSchema.optional(),
  bio: z.string().max(500, 'Bio must be at most 500 characters').optional(),
  avatar: urlSchema.optional(),
  email: emailSchema.optional(),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(['USER', 'ADMIN', 'SUPER_ADMIN'], {
    errorMap: () => ({ message: 'Invalid role' }),
  }),
});

export const updateUserPlanSchema = z.object({
  plan: z.enum(['FREE', 'PRO', 'ENTERPRISE'], {
    errorMap: () => ({ message: 'Invalid plan' }),
  }),
});

// Site management schemas
export const createSiteSchema = z.object({
  name: z.string().min(1, 'Site name is required').max(100, 'Site name must be at most 100 characters'),
  url: urlSchema,
  description: z.string().max(500, 'Description must be at most 500 characters').optional(),
  category: z.string().max(50, 'Category must be at most 50 characters').optional(),
});

export const updateSiteSchema = z.object({
  name: z.string().min(1, 'Site name is required').max(100, 'Site name must be at most 100 characters').optional(),
  url: urlSchema.optional(),
  description: z.string().max(500, 'Description must be at most 500 characters').optional(),
  category: z.string().max(50, 'Category must be at most 50 characters').optional(),
  isActive: z.boolean().optional(),
});

export const siteCredentialsSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  applicationPassword: z.string().optional(),
});

// Content management schemas
export const createContentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be at most 200 characters'),
  content: z.string().min(1, 'Content is required'),
  excerpt: z.string().max(500, 'Excerpt must be at most 500 characters').optional(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  type: z.enum(['post', 'page', 'custom']).default('post'),
  categories: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  featuredImage: urlSchema.optional(),
  seoTitle: z.string().max(60, 'SEO title must be at most 60 characters').optional(),
  seoDescription: z.string().max(160, 'SEO description must be at most 160 characters').optional(),
  publishDate: z.date().optional(),
  siteId: uuidSchema,
});

export const updateContentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be at most 200 characters').optional(),
  content: z.string().min(1, 'Content is required').optional(),
  excerpt: z.string().max(500, 'Excerpt must be at most 500 characters').optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  type: z.enum(['post', 'page', 'custom']).optional(),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  featuredImage: urlSchema.optional(),
  seoTitle: z.string().max(60, 'SEO title must be at most 60 characters').optional(),
  seoDescription: z.string().max(160, 'SEO description must be at most 160 characters').optional(),
  publishDate: z.date().optional(),
});

// Content generation schemas
export const generateContentSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(1000, 'Prompt must be at most 1000 characters'),
  type: z.enum(['blog_post', 'article', 'product_description', 'social_media', 'email', 'other']).default('blog_post'),
  tone: z.enum(['professional', 'casual', 'friendly', 'formal', 'humorous']).default('professional'),
  length: z.enum(['short', 'medium', 'long']).default('medium'),
  keywords: z.array(z.string()).default([]),
  targetAudience: z.string().max(200, 'Target audience must be at most 200 characters').optional(),
  siteId: uuidSchema.optional(),
});

export const enhanceContentSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  enhancementType: z.enum(['grammar', 'clarity', 'tone', 'length', 'seo', 'readability']).default('clarity'),
  targetAudience: z.string().max(200, 'Target audience must be at most 200 characters').optional(),
  keywords: z.array(z.string()).default([]),
});

// File upload schemas
export const fileUploadSchema = z.object({
  file: z.instanceof(File, { message: 'Invalid file' }),
  type: z.enum(['image', 'document', 'video', 'audio', 'other']).default('image'),
  maxSize: z.number().positive().default(10 * 1024 * 1024), // 10MB default
  allowedTypes: z.array(z.string()).default(['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
});

// Notification schemas
export const createNotificationSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be at most 100 characters'),
  message: z.string().min(1, 'Message is required').max(500, 'Message must be at most 500 characters'),
  type: z.enum(['info', 'success', 'warning', 'error']).default('info'),
  targetUserId: uuidSchema.optional(),
  isGlobal: z.boolean().default(false),
  actionUrl: urlSchema.optional(),
});

export const markNotificationReadSchema = z.object({
  notificationId: uuidSchema,
});

// Analytics schemas
export const analyticsQuerySchema = z.object({
  siteId: uuidSchema.optional(),
  startDate: z.string().datetime('Invalid start date').optional(),
  endDate: z.string().datetime('Invalid end date').optional(),
  metrics: z.array(z.enum(['views', 'visitors', 'engagement', 'bounce_rate', 'conversion'])).default(['views']),
  interval: z.enum(['day', 'week', 'month', 'year']).default('day'),
});

// Search schemas
export const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(100, 'Search query must be at most 100 characters'),
  type: z.enum(['content', 'sites', 'users', 'all']).default('all'),
  filters: z.object({
    status: z.array(z.string()).optional(),
    category: z.array(z.string()).optional(),
    dateRange: z.object({
      start: z.string().datetime().optional(),
      end: z.string().datetime().optional(),
    }).optional(),
  }).optional(),
  sortBy: z.enum(['relevance', 'date', 'title', 'popularity']).default('relevance'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

// Pagination schemas
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Utility functions
export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Validation failed', error.errors);
    }
    throw error;
  }
}

export function validateSchemaAsync<T>(schema: z.ZodSchema<T>, data: unknown): Promise<T> {
  return schema.parseAsync(data).catch((error) => {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Validation failed', error.errors);
    }
    throw error;
  });
}

export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/[^\w\s\-_.]/g, ''); // Allow only word characters, spaces, hyphens, underscores, and dots
}

export function sanitizeHtml(input: string): string {
  // Basic HTML sanitization - in production, use a library like DOMPurify
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');
}

// Request validation middleware
export function validateRequest<T>(schema: z.ZodSchema<T>) {
  return (request: Request): T => {
    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      return validateSchema(schema, request.json());
    }
    
    if (contentType?.includes('application/x-www-form-urlencoded')) {
      return validateSchema(schema, Object.fromEntries(new URLSearchParams(await request.text())));
    }
    
    throw new ValidationError('Invalid content type', { expected: 'application/json or application/x-www-form-urlencoded' });
  };
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

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
export type UpdateUserPlanInput = z.infer<typeof updateUserPlanSchema>;
export type CreateSiteInput = z.infer<typeof createSiteSchema>;
export type UpdateSiteInput = z.infer<typeof updateSiteSchema>;
export type SiteCredentialsInput = z.infer<typeof siteCredentialsSchema>;
export type CreateContentInput = z.infer<typeof createContentSchema>;
export type UpdateContentInput = z.infer<typeof updateContentSchema>;
export type GenerateContentInput = z.infer<typeof generateContentSchema>;
export type EnhanceContentInput = z.infer<typeof enhanceContentSchema>;
export type FileUploadInput = z.infer<typeof fileUploadSchema>;
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type MarkNotificationReadInput = z.infer<typeof markNotificationReadSchema>;
export type AnalyticsQueryInput = z.infer<typeof analyticsQuerySchema>;
export type SearchInput = z.infer<typeof searchSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;