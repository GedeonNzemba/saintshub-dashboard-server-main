/**
 * Validation Middleware
 * Handles express-validator error checking
 */

import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

/**
 * Middleware to check validation results
 * Returns 400 with errors if validation fails
 */
export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.type === 'field' ? (err as any).path : undefined,
        message: err.msg
      }))
    });
  }
  
  next();
};
