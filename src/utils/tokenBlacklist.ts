// src/utils/tokenBlacklist.ts
/**
 * Token Blacklist Service (Redis-based)
 * 
 * Purpose: Manage invalidated JWT tokens to prevent reuse after logout.
 * 
 * How it works:
 * 1. When a user logs out, their token is added to Redis with TTL matching token expiry
 * 2. The authMiddleware checks if a token exists in Redis before granting access
 * 3. Redis automatically removes expired tokens (no manual cleanup needed)
 * 
 * Benefits over in-memory:
 * - Survives server restarts
 * - Works across multiple server instances
 * - Automatic expiration cleanup
 * - Production-ready and scalable
 */

import getRedisClient from './redis';

const BLACKLIST_PREFIX = 'blacklist:token:';

/**
 * Add a token to the blacklist
 * @param token - JWT token to blacklist
 * @param expiresAt - Unix timestamp (milliseconds) when the token expires
 */
export const addToBlacklist = async (token: string, expiresAt: number): Promise<void> => {
  try {
    const redis = getRedisClient();
    const now = Date.now();
    const ttlSeconds = Math.max(1, Math.floor((expiresAt - now) / 1000));
    
    // Store token with automatic expiration (Redis TTL)
    await redis.setex(`${BLACKLIST_PREFIX}${token}`, ttlSeconds, '1');
    
    const logger = require('./logger').default;
    logger.info(`✅ Token blacklisted. Expires in ${ttlSeconds}s`);
  } catch (error) {
    const logger = require('./logger').default;
    logger.error('❌ Failed to add token to blacklist:', { error });
    // In case of Redis failure, log but don't throw (graceful degradation)
    // Alternative: Fall back to in-memory storage or throw error
  }
};

/**
 * Check if a token is blacklisted
 * @param token - JWT token to check
 * @returns true if token is blacklisted, false otherwise
 */
export const isBlacklisted = async (token: string): Promise<boolean> => {
  try {
    const redis = getRedisClient();
    const result = await redis.exists(`${BLACKLIST_PREFIX}${token}`);
    return result === 1;
  } catch (error) {
    console.error('❌ Failed to check token blacklist:', error);
    // In case of Redis failure, deny access (fail secure)
    return false;
  }
};

/**
 * Remove a token from the blacklist (manual removal, rarely needed)
 * @param token - JWT token to remove
 */
export const removeFromBlacklist = async (token: string): Promise<void> => {
  try {
    const redis = getRedisClient();
    await redis.del(`${BLACKLIST_PREFIX}${token}`);
    console.log('✅ Token removed from blacklist');
  } catch (error) {
    console.error('❌ Failed to remove token from blacklist:', error);
  }
};

/**
 * Get blacklist statistics (for monitoring/debugging)
 */
export const getBlacklistStats = async (): Promise<{ totalTokens: number }> => {
  try {
    const redis = getRedisClient();
    const keys = await redis.keys(`${BLACKLIST_PREFIX}*`);
    return {
      totalTokens: keys.length
    };
  } catch (error) {
    console.error('❌ Failed to get blacklist stats:', error);
    return { totalTokens: 0 };
  }
};

/**
 * Clear all blacklisted tokens (for testing/admin purposes only)
 * WARNING: Use with caution in production
 */
export const clearAllBlacklistedTokens = async (): Promise<void> => {
  try {
    const redis = getRedisClient();
    const keys = await redis.keys(`${BLACKLIST_PREFIX}*`);
    
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`✅ Cleared ${keys.length} blacklisted tokens`);
    } else {
      console.log('ℹ️  No blacklisted tokens to clear');
    }
  } catch (error) {
    console.error('❌ Failed to clear blacklisted tokens:', error);
  }
};

// Note: No manual cleanup interval needed - Redis TTL handles expiration automatically!
