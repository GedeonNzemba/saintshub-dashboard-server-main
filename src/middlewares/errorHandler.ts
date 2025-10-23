/**
 * Centralized Error Handling Middleware
 * 
 * Purpose: Catch and format all errors in a consistent way across the API
 * 
 * Benefits:
 * - Consistent error responses for frontend
 * - Better error logging and monitoring
 * - Prevents server crashes from unhandled errors
 * - Clean error messages in production (no stack traces)
 * - Development-friendly (detailed errors in dev mode)
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Custom Error Class
 * Extends native Error with additional properties for API responses
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Marks errors we can handle gracefully
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Not Found Error (404)
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

/**
 * Validation Error (400)
 */
export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed') {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

/**
 * Unauthorized Error (401)
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

/**
 * Forbidden Error (403)
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Access forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

/**
 * Conflict Error (409) - e.g., duplicate email
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(message, 409, 'CONFLICT');
  }
}

/**
 * Internal Server Error (500)
 */
export class InternalError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(message, 500, 'INTERNAL_ERROR');
  }
}

/**
 * Handle Mongoose/MongoDB Errors
 */
const handleMongooseError = (err: any): AppError => {
  // Duplicate key error (e.g., email already exists)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return new ConflictError(`${field} already exists`);
  }

  // Validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e: any) => e.message);
    return new ValidationError(`Validation failed: ${errors.join(', ')}`);
  }

  // Cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return new ValidationError(`Invalid ${err.path}: ${err.value}`);
  }

  return new InternalError('Database operation failed');
};

/**
 * Handle JWT Errors
 */
const handleJWTError = (err: any): AppError => {
  if (err.name === 'JsonWebTokenError') {
    return new UnauthorizedError('Invalid token');
  }

  if (err.name === 'TokenExpiredError') {
    return new UnauthorizedError('Token expired');
  }

  return new UnauthorizedError('Authentication failed');
};

/**
 * Error Handler Middleware
 * MUST be placed after all routes and other middleware
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = err;

  // Convert non-AppError errors to AppError
  if (!(error instanceof AppError)) {
    // Handle Mongoose/MongoDB errors
    if (error.name === 'ValidationError' || error.name === 'CastError' || error.code === 11000) {
      error = handleMongooseError(error);
    }
    // Handle JWT errors
    else if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      error = handleJWTError(error);
    }
    // Generic error
    else {
      error = new AppError(error.message || 'Something went wrong', error.statusCode || 500);
    }
  }

  // Log error using Winston logger
  const logger = require('../utils/logger').default;
  logger.error('API Error', {
    message: error.message,
    statusCode: error.statusCode,
    code: error.code,
    stack: error.stack,
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  // Prepare response
  const response: any = {
    success: false,
    message: error.message,
    code: error.code
  };

  // Include stack trace in development mode only
  if (process.env.NODE_ENV === 'development' && error.stack) {
    response.stack = error.stack;
  }

  // Send error response
  res.status(error.statusCode || 500).json(response);
};

/**
 * 404 Not Found Handler
 * Catches all routes that don't exist
 * MUST be placed after all route definitions but before errorHandler
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
};

/**
 * Async Handler Wrapper
 * Eliminates need for try-catch in async route handlers
 * 
 * Usage:
 * ```typescript
 * router.get('/user', asyncHandler(async (req, res) => {
 *   const user = await User.findById(req.userId);
 *   if (!user) throw new NotFoundError('User');
 *   res.json({ success: true, data: user });
 * }));
 * ```
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Usage Examples:
 * 
 * 1. Apply error handler to Express app (in index.ts):
 * ```typescript
 * import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
 * 
 * // ... all routes ...
 * 
 * app.use(notFoundHandler); // Catch 404s
 * app.use(errorHandler);    // Handle all errors
 * ```
 * 
 * 2. Throw errors in controllers:
 * ```typescript
 * const user = await User.findById(id);
 * if (!user) {
 *   throw new NotFoundError('User');
 * }
 * ```
 * 
 * 3. Use asyncHandler to avoid try-catch:
 * ```typescript
 * router.get('/user/:id', asyncHandler(async (req, res) => {
 *   const user = await User.findById(req.params.id);
 *   if (!user) throw new NotFoundError('User');
 *   res.json({ success: true, data: user });
 * }));
 * ```
 */
