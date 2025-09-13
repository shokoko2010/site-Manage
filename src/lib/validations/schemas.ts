import { z } from 'zod';

// Auth validation schemas
export const loginSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .min(1, 'Email is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters'),
});

export const registerSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .min(1, 'Email is required'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
});

// Site validation schemas
export const createSiteSchema = z.object({
  url: z.string()
    .url('Invalid URL')
    .min(1, 'URL is required'),
  name: z.string()
    .min(2, 'Site name must be at least 2 characters')
    .max(100, 'Site name must be less than 100 characters'),
  username: z.string()
    .min(1, 'Username is required')
    .max(100, 'Username must be less than 100 characters'),
  appPassword: z.string()
    .min(1, 'Application password is required')
    .max(200, 'Application password must be less than 200 characters'),
  isVirtual: z.boolean().optional().default(false),
});

export const updateSiteSchema = z.object({
  url: z.string()
    .url('Invalid URL')
    .min(1, 'URL is required')
    .optional(),
  name: z.string()
    .min(2, 'Site name must be at least 2 characters')
    .max(100, 'Site name must be less than 100 characters')
    .optional(),
  username: z.string()
    .min(1, 'Username is required')
    .max(100, 'Username must be less than 100 characters')
    .optional(),
  appPassword: z.string()
    .min(1, 'Application password is required')
    .max(200, 'Application password must be less than 200 characters')
    .optional(),
  isActive: z.boolean().optional(),
});

// Content validation schemas
export const createContentSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  body: z.string()
    .min(1, 'Content is required')
    .max(50000, 'Content must be less than 50,000 characters'),
  type: z.enum(['ARTICLE', 'PRODUCT', 'CAMPAIGN'], {
    errorMap: () => ({ message: 'Invalid content type' }),
  }),
  siteId: z.string()
    .min(1, 'Site ID is required')
    .optional(),
  metaDescription: z.string()
    .max(300, 'Meta description must be less than 300 characters')
    .optional(),
  featuredImage: z.string()
    .url('Invalid featured image URL')
    .optional(),
  language: z.enum(['ENGLISH', 'ARABIC', 'FRENCH', 'SPANISH', 'GERMAN', 'JAPANESE'], {
    errorMap: () => ({ message: 'Invalid language' }),
  }).optional(),
});

export const updateContentSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .optional(),
  body: z.string()
    .min(1, 'Content is required')
    .max(50000, 'Content must be less than 50,000 characters')
    .optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'PENDING', 'SCHEDULED', 'ARCHIVED'], {
    errorMap: () => ({ message: 'Invalid status' }),
  }).optional(),
  metaDescription: z.string()
    .max(300, 'Meta description must be less than 300 characters')
    .optional(),
  featuredImage: z.string()
    .url('Invalid featured image URL')
    .optional(),
  language: z.enum(['ENGLISH', 'ARABIC', 'FRENCH', 'SPANISH', 'GERMAN', 'JAPANESE'], {
    errorMap: () => ({ message: 'Invalid language' }),
  }).optional(),
});

// AI content generation schema
export const generateContentSchema = z.object({
  prompt: z.string()
    .min(10, 'Prompt must be at least 10 characters')
    .max(1000, 'Prompt must be less than 1,000 characters'),
  type: z.enum(['ARTICLE', 'PRODUCT', 'CAMPAIGN'], {
    errorMap: () => ({ message: 'Invalid content type' }),
  }),
  tone: z.enum(['professional', 'casual', 'friendly', 'formal', 'humorous'], {
    errorMap: () => ({ message: 'Invalid tone' }),
  }).optional(),
  length: z.enum(['short', 'medium', 'long'], {
    errorMap: () => ({ message: 'Invalid length' }),
  }).optional(),
});

// Export types
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type CreateSiteFormData = z.infer<typeof createSiteSchema>;
export type UpdateSiteFormData = z.infer<typeof updateSiteSchema>;
export type CreateContentFormData = z.infer<typeof createContentSchema>;
export type UpdateContentFormData = z.infer<typeof updateContentSchema>;
export type GenerateContentFormData = z.infer<typeof generateContentSchema>;