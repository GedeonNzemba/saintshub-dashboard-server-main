/**
 * Response Caching Middleware
 * 
 * Purpose: Cache API responses to reduce database load and improve performance
 * 
 * Benefits:
 * - Faster response times for frequently accessed data
 * - Reduced MongoDB read operations (saves costs)
 * - Better server scalability
 * - Improved user experience
 * 
 * Cache Strategy:
 * - Church lists: 5 minutes (changes infrequently)
 * - Public profiles: 2 minutes (may update but not often)
 * - Authenticated user data: No cache (always fresh)
 * 
 * Cache Invalidation:
 * - Automatic expiration (TTL)
 * - Manual flush on data updates
 */

import NodeCache from 'node-cache';
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Cache Configuration
 */
const cache = new NodeCache({
  stdTTL: 300, // Default TTL: 5 minutes (300 seconds)
  checkperiod: 60, // Check for expired keys every 60 seconds
  useClones: false, // Don't clone objects (better performance)
  deleteOnExpire: true, // Delete expired keys automatically
});

// Cache statistics for monitoring
cache.on('set', (key, value) => {
  logger.debug('Cache SET', { key, size: JSON.stringify(value).length });
});

cache.on('del', (key, value) => {
  logger.debug('Cache DEL', { key });
});

cache.on('expired', (key, value) => {
  logger.debug('Cache EXPIRED', { key });
});

/**
 * Cache Middleware
 * Checks if response is cached before hitting database
 * 
 * @param ttl - Time to live in seconds (default: 300 = 5 minutes)
 */
export const cacheMiddleware = (ttl: number = 300) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key from route and query params
    const cacheKey = generateCacheKey(req);

    // Try to get cached response
    const cachedResponse = cache.get(cacheKey);

    if (cachedResponse) {
      logger.info('Cache HIT', { key: cacheKey, path: req.path });
      
      // Send cached response
      return res.status(200).json({
        ...(cachedResponse as object),
        cached: true,
        cacheTimestamp: Date.now()
      });
    }

    logger.info('Cache MISS', { key: cacheKey, path: req.path });

    // Store original res.json function
    const originalJson = res.json.bind(res);

    // Override res.json to cache the response
    res.json = function(body: any) {
      // Only cache successful responses (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(cacheKey, body, ttl);
        logger.debug('Response cached', { key: cacheKey, ttl });
      }

      // Call original json function
      return originalJson(body);
    };

    next();
  };
};

/**
 * Generate cache key from request
 * Format: METHOD:PATH?QUERY
 */
const generateCacheKey = (req: Request): string => {
  const queryString = JSON.stringify(req.query);
  const params = JSON.stringify(req.params);
  return `${req.method}:${req.path}?query=${queryString}&params=${params}`;
};

/**
 * Clear specific cache key
 */
export const clearCache = (key: string): void => {
  const deleted = cache.del(key);
  if (deleted > 0) {
    logger.info('Cache cleared', { key });
  }
};

/**
 * Clear all cache matching a pattern
 * Example: clearCachePattern('/api/churches')
 */
export const clearCachePattern = (pattern: string): void => {
  const keys = cache.keys();
  const matchingKeys = keys.filter(key => key.includes(pattern));
  
  if (matchingKeys.length > 0) {
    cache.del(matchingKeys);
    logger.info('Cache pattern cleared', { pattern, count: matchingKeys.length });
  }
};

/**
 * Flush all cache (use sparingly)
 */
export const flushCache = (): void => {
  cache.flushAll();
  logger.warn('All cache flushed');
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => {
  return {
    keys: cache.keys().length,
    hits: cache.getStats().hits,
    misses: cache.getStats().misses,
    ksize: cache.getStats().ksize,
    vsize: cache.getStats().vsize,
  };
};

/**
 * Cache invalidation middleware for updates
 * Clears cache when data is modified
 */
export const invalidateCacheOnUpdate = (pattern: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Store original json function
    const originalJson = res.json.bind(res);

    // Override to clear cache after successful update
    res.json = function(body: any) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        clearCachePattern(pattern);
      }
      return originalJson(body);
    };

    next();
  };
};

export default cache;

/**
 * Usage Examples:
 * 
 * 1. Cache church list for 5 minutes:
 * ```typescript
 * router.get('/churches', cacheMiddleware(300), getChurches);
 * ```
 * 
 * 2. Cache with custom TTL (2 minutes):
 * ```typescript
 * router.get('/public/profile/:id', cacheMiddleware(120), getPublicProfile);
 * ```
 * 
 * 3. Invalidate cache on update:
 * ```typescript
 * router.patch('/churches/:id', invalidateCacheOnUpdate('/churches'), updateChurch);
 * ```
 * 
 * 4. Manual cache clearing:
 * ```typescript
 * // Clear specific key
 * clearCache('GET:/api/churches');
 * 
 * // Clear all church routes
 * clearCachePattern('/churches');
 * 
 * // Clear everything (use sparingly)
 * flushCache();
 * ```
 * 
 * 5. Get cache stats:
 * ```typescript
 * const stats = getCacheStats();
 * console.log('Cache hits:', stats.hits);
 * console.log('Cache keys:', stats.keys);
 * ```
 */
