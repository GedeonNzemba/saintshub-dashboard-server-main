/**
 * Input Validation Middleware
 * 
 * Purpose: Validate and sanitize all user inputs to prevent:
 * - SQL/NoSQL Injection attacks
 * - XSS (Cross-Site Scripting) attacks
 * - Invalid data causing server crashes
 * - Malformed requests
 * 
 * Uses express-validator for comprehensive validation
 */

import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

/**
 * Validation Error Handler
 * Extracts validation errors and returns formatted response
 */
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.type === 'field' ? (err as any).path : 'unknown',
      message: err.msg
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors
    });
  }
  
  next();
};

/**
 * Signup Validation Rules
 * Validates: name, surname, email, password, language, role
 */
export const validateSignup = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/).withMessage('Name can only contain letters, spaces, hyphens, and apostrophes'),
  
  body('surname')
    .trim()
    .notEmpty().withMessage('Surname is required')
    .isLength({ min: 2, max: 50 }).withMessage('Surname must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/).withMessage('Surname can only contain letters, spaces, hyphens, and apostrophes'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail()
    .isLength({ max: 100 }).withMessage('Email is too long'),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
    .isLength({ max: 100 }).withMessage('Password is too long')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/).withMessage('Password must contain at least one letter and one number'),
  
  body('language')
    .optional()
    .isIn(['en', 'fr']).withMessage('Language must be either "en" or "fr"'),
  
  body('role')
    .optional()
    .isIn(['pastor', 'it', 'user']).withMessage('Role must be one of: pastor, it, user'),
  
  handleValidationErrors
];

/**
 * Signin Validation Rules
 * Validates: email, password
 */
export const validateSignin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required'),
  
  handleValidationErrors
];

/**
 * Update User Profile Validation Rules
 * Validates: name, surname (email is blocked in controller)
 */
export const validateUpdateUser = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/).withMessage('Name can only contain letters, spaces, hyphens, and apostrophes'),
  
  body('surname')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Surname must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/).withMessage('Surname can only contain letters, spaces, hyphens, and apostrophes'),
  
  body('email')
    .custom(() => {
      throw new Error('Email cannot be updated');
    }),
  
  handleValidationErrors
];

/**
 * Update Password Validation Rules
 * Validates: currentPassword, newPassword
 */
export const validateUpdatePassword = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),
  
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 6 }).withMessage('New password must be at least 6 characters long')
    .isLength({ max: 100 }).withMessage('New password is too long')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/).withMessage('New password must contain at least one letter and one number'),
  
  handleValidationErrors
];

/**
 * Church Creation Validation Rules
 * Validates: name, location, description, services, etc.
 */
export const validateCreateChurch = [
  body('name')
    .trim()
    .notEmpty().withMessage('Church name is required')
    .isLength({ min: 3, max: 100 }).withMessage('Church name must be between 3 and 100 characters'),
  
  body('location')
    .trim()
    .notEmpty().withMessage('Location is required')
    .isLength({ min: 3, max: 200 }).withMessage('Location must be between 3 and 200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description is too long (max 1000 characters)'),
  
  body('services')
    .optional()
    .isArray().withMessage('Services must be an array'),
  
  body('services.*.day')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Service day is too long'),
  
  body('services.*.time')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Service time is too long'),
  
  body('services.*.sermon')
    .optional()
    .trim()
    .isURL({ require_protocol: true }).withMessage('Sermon must be a valid URL with protocol (http:// or https://)').optional({ checkFalsy: true }),
  
  body('phoneNumber')
    .optional()
    .trim()
    .matches(/^[\d\s\-\+\(\)]+$/).withMessage('Phone number can only contain numbers, spaces, hyphens, plus signs, and parentheses')
    .isLength({ max: 20 }).withMessage('Phone number is too long'),
  
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('website')
    .optional()
    .trim()
    .isURL({ require_protocol: true }).withMessage('Website must be a valid URL with protocol (http:// or https://)').optional({ checkFalsy: true }),
  
  handleValidationErrors
];

/**
 * Church Update Validation Rules
 * Same as create but all fields optional
 */
export const validateUpdateChurch = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 }).withMessage('Church name must be between 3 and 100 characters'),
  
  body('location')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 }).withMessage('Location must be between 3 and 200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description is too long (max 1000 characters)'),
  
  body('phoneNumber')
    .optional()
    .trim()
    .matches(/^[\d\s\-\+\(\)]+$/).withMessage('Phone number can only contain numbers, spaces, hyphens, plus signs, and parentheses')
    .isLength({ max: 20 }).withMessage('Phone number is too long'),
  
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('website')
    .optional()
    .trim()
    .isURL({ require_protocol: true }).withMessage('Website must be a valid URL with protocol (http:// or https://)').optional({ checkFalsy: true }),
  
  handleValidationErrors
];

/**
 * Delete Account Validation
 * Validates: password (required for security)
 */
export const validateDeleteAccount = [
  body('password')
    .notEmpty().withMessage('Password is required to delete account'),
  
  handleValidationErrors
];

/**
 * MongoDB ObjectId Validation
 * Validates: id parameter in routes
 */
export const validateMongoId = (paramName: string = 'id') => [
  body(paramName)
    .matches(/^[0-9a-fA-F]{24}$/).withMessage(`Invalid ${paramName} format`),
  
  handleValidationErrors
];
