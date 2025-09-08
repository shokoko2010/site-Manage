import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

// User validation
export const validateRegister = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('username')
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('name')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
];

export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

// WordPress Site validation
export const validateSite = [
  body('url')
    .isURL()
    .withMessage('Please provide a valid URL')
    .custom((value) => {
      try {
        new URL(value);
        return true;
      } catch {
        throw new Error('Invalid URL format');
      }
    }),
  body('username')
    .optional()
    .isLength({ min: 1 })
    .withMessage('Username is required for non-virtual sites'),
  body('appPassword')
    .optional()
    .isLength({ min: 1 })
    .withMessage('Application password is required for non-virtual sites'),
];

// Content validation
export const validateContent = [
  body('type')
    .isIn(['ARTICLE', 'PRODUCT', 'CAMPAIGN'])
    .withMessage('Invalid content type'),
  body('title')
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('body')
    .isLength({ min: 1 })
    .withMessage('Content body is required'),
  body('metaDescription')
    .optional()
    .isLength({ max: 300 })
    .withMessage('Meta description must be less than 300 characters'),
];

// Validation handler middleware
export const handleValidation = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array(),
    });
  }
  next();
};