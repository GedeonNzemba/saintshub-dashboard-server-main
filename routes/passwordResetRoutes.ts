/**
 * Password Reset Routes
 */

import express from 'express';
import { body } from 'express-validator';
import {
  requestPasswordReset,
  resetPassword,
  verifyResetToken
} from '../controllers/passwordResetController';
import { validateRequest } from '../middlewares/validationMiddleware';

const router = express.Router();

// Request password reset - sends email with reset link
router.post(
  '/forgot-password',
  [
    body('email')
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail()
  ],
  validateRequest,
  requestPasswordReset
);

// Reset password with token
router.post(
  '/reset-password',
  [
    body('token')
      .trim()
      .notEmpty()
      .withMessage('Reset token is required'),
    body('newPassword')
      .trim()
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
  ],
  validateRequest,
  resetPassword
);

// Verify reset token (optional - for frontend validation)
router.get('/verify-reset-token/:token', verifyResetToken);

export default router;
