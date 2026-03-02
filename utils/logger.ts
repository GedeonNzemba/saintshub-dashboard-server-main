/**
 * Winston Logger Configuration
 * 
 * Purpose: Professional logging system for production monitoring
 * 
 * Features:
 * - Multiple log levels (error, warn, info, debug)
 * - File rotation (prevents huge log files)
 * - Colored console output in development
 * - JSON format for production (easier parsing)
 * - Timestamp on all logs
 * - Separate error log file
 * 
 * Log Levels:
 * - error: Critical errors that need immediate attention
 * - warn: Warning messages (degraded performance, deprecated features)
 * - info: General information (startup, shutdown, important events)
 * - debug: Detailed debugging information (development only)
 */

import winston from 'winston';
import path from 'path';

// Determine log level based on environment
const logLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');

/**
 * Custom log format for console (development)
 * Includes colors and pretty printing
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      metaStr = `\n${JSON.stringify(meta, null, 2)}`;
    }
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

/**
 * Custom log format for files (production)
 * JSON format for easy parsing and analysis
 */
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * Winston Logger Instance
 */
const logger = winston.createLogger({
  level: logLevel,
  format: fileFormat,
  defaultMeta: { service: 'saintshub-api' },
  transports: [
    // Write all logs to combined.log
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5, // Keep last 5 files
    }),

    // Write only errors to error.log
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
    }),
  ],
  // Handle unhandled promise rejections
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
    }),
  ],
});

/**
 * Add console output in development mode
 * Makes logs easy to read during development
 */
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

/**
 * Stream for Morgan HTTP request logging
 * Allows Morgan to write to Winston
 */
export const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

/**
 * Helper functions for common logging patterns
 */

/**
 * Log successful authentication
 */
export const logAuth = (userId: string, action: string) => {
  logger.info('Authentication event', { userId, action });
};

/**
 * Log database operations
 */
export const logDB = (operation: string, collection: string, success: boolean) => {
  logger.info('Database operation', { operation, collection, success });
};

/**
 * Log API requests (can be used with middleware)
 */
export const logRequest = (method: string, path: string, statusCode: number, responseTime: number) => {
  logger.info('API Request', { method, path, statusCode, responseTime });
};

/**
 * Log errors with context
 */
export const logError = (error: Error, context?: any) => {
  logger.error(error.message, {
    stack: error.stack,
    ...context,
  });
};

export default logger;

/**
 * Usage Examples:
 * 
 * 1. Basic logging:
 * ```typescript
 * import logger from './utils/logger';
 * 
 * logger.info('Server started on port 3003');
 * logger.error('Database connection failed', { error: err });
 * logger.warn('Deprecated API endpoint used');
 * logger.debug('User payload:', user);
 * ```
 * 
 * 2. Replace console.log:
 * ```typescript
 * // Before:
 * console.log('User logged in');
 * 
 * // After:
 * logger.info('User logged in', { userId: user._id });
 * ```
 * 
 * 3. Error logging:
 * ```typescript
 * try {
 *   await someOperation();
 * } catch (error) {
 *   logError(error, { operation: 'someOperation', userId });
 *   throw error;
 * }
 * ```
 * 
 * 4. Authentication logging:
 * ```typescript
 * logAuth(user._id, 'login');
 * logAuth(user._id, 'logout');
 * ```
 */
