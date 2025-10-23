/**
 * Rate Limiting Middleware
 * 
 * Purpose: Protect API from abuse, DDoS attacks, and brute force attempts
 * 
 * Strategy:
 * - Public routes (login, signup): 5 requests/15min per IP (prevents brute force)
 * - Authenticated routes: 100 requests/15min per IP (generous for normal use)
 * - File upload routes: 20 requests/15min per IP (prevents storage abuse)
 * 
 * Benefits:
 * - Prevents credential stuffing attacks
 * - Protects against DDoS
 * - Reduces server load from malicious traffic
 * - Industry standard security practice
 */

import rateLimit from 'express-rate-limit';

/**
 * Strict Rate Limiter for Authentication Routes
 * Applied to: /api/auth/login, /api/auth/signup
 * 
 * Limits: 5 requests per 15 minutes per IP
 * Reason: Prevents brute force password attacks
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
    hint: 'For security, we limit login/signup attempts per IP address.'
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skipSuccessfulRequests: false, // Count all requests, even successful ones
  skipFailedRequests: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
      retryAfter: '15 minutes'
    });
  }
});

/**
 * Standard Rate Limiter for General API Routes
 * Applied to: All authenticated routes (/api/user, /api/churches, etc.)
 * 
 * Limits: 100 requests per 15 minutes per IP
 * Reason: Generous limit for normal app usage, blocks automated scripts
 */
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    success: false,
    message: 'Too many requests. Please slow down.',
    hint: 'Rate limit: 100 requests per 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Rate limit exceeded. Please try again later.',
      limit: 100,
      window: '15 minutes'
    });
  }
});

/**
 * File Upload Rate Limiter
 * Applied to: File upload endpoints
 * 
 * Limits: 20 uploads per 15 minutes per IP
 * Reason: Prevents storage abuse and excessive bandwidth usage
 */
export const uploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 uploads per window
  message: {
    success: false,
    message: 'Too many file uploads. Please wait before uploading more files.',
    hint: 'Limit: 20 uploads per 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Upload rate limit exceeded. Please try again after 15 minutes.',
      limit: 20,
      window: '15 minutes'
    });
  }
});

/**
 * Flexible Rate Limiter Creator
 * Use this to create custom rate limiters for specific routes
 * 
 * @param maxRequests - Maximum number of requests allowed
 * @param windowMinutes - Time window in minutes
 * @param message - Custom error message
 */
export const createCustomRateLimiter = (
  maxRequests: number,
  windowMinutes: number,
  message: string = 'Rate limit exceeded'
) => {
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max: maxRequests,
    message: {
      success: false,
      message: message,
      limit: maxRequests,
      window: `${windowMinutes} minutes`
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message: message,
        limit: maxRequests,
        window: `${windowMinutes} minutes`
      });
    }
  });
};

/**
 * Rate Limiter Usage Examples:
 * 
 * Apply to authentication routes:
 * ```typescript
 * app.use('/api/auth', authRateLimiter);
 * ```
 * 
 * Apply to all API routes:
 * ```typescript
 * app.use('/api', generalRateLimiter);
 * ```
 * 
 * Apply to specific route:
 * ```typescript
 * app.post('/api/upload', uploadRateLimiter, uploadController);
 * ```
 * 
 * Custom rate limiter:
 * ```typescript
 * const customLimiter = createCustomRateLimiter(50, 10, 'Too many requests to this endpoint');
 * app.use('/api/special', customLimiter);
 * ```
 */
