import { z } from 'zod';

// Auth validation schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(20, 'Username must be at most 20 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be at most 50 characters'),
});

// Site validation schemas
export const createSiteSchema = z.object({
  url: z.string().url('Invalid URL'),
  name: z.string().min(2, 'Site name must be at least 2 characters').max(100, 'Site name must be at most 100 characters'),
  username: z.string().optional(),
  appPassword: z.string().optional(),
  isVirtual: z.boolean().default(false),
}).refine((data) => {
  // If not virtual, username and appPassword are required
  if (!data.isVirtual) {
    return data.username && data.appPassword;
  }
  return true;
}, {
  message: "Username and app password are required for non-virtual sites",
  path: ["username"],
});

// Content validation schemas
export const createContentSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200, 'Title must be at most 200 characters'),
  body: z.string().min(10, 'Content must be at least 10 characters'),
  type: z.enum(['ARTICLE', 'PRODUCT', 'CAMPAIGN'], {
    errorMap: () => ({ message: 'Invalid content type' })
  }),
  metaDescription: z.string().max(300, 'Meta description must be at most 300 characters').optional(),
  language: z.enum(['ENGLISH', 'ARABIC', 'FRENCH', 'SPANISH', 'GERMAN', 'JAPANESE'], {
    errorMap: () => ({ message: 'Invalid language' })
  }).default('ENGLISH'),
  siteId: z.string().optional(),
  featuredImage: z.string().url('Invalid image URL').optional(),
});

// Update content schema
export const updateContentSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200, 'Title must be at most 200 characters').optional(),
  body: z.string().min(10, 'Content must be at least 10 characters').optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'PENDING', 'SCHEDULED', 'ARCHIVED'], {
    errorMap: () => ({ message: 'Invalid status' })
  }).optional(),
  metaDescription: z.string().max(300, 'Meta description must be at most 300 characters').optional(),
  featuredImage: z.string().url('Invalid image URL').optional(),
});

// User validation schemas
export const updateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be at most 50 characters').optional(),
  bio: z.string().max(500, 'Bio must be at most 500 characters').optional(),
  avatar: z.string().url('Invalid avatar URL').optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Confirm password must be at least 8 characters'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Export types
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateSiteInput = z.infer<typeof createSiteSchema>;
export type CreateContentInput = z.infer<typeof createContentSchema>;
export type UpdateContentInput = z.infer<typeof updateContentSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;