/**
 * Redis Client Configuration
 * 
 * Provides Redis connection for:
 * - Token blacklist (logout/session management)
 * - Response caching (future use)
 * - Rate limiting (future use)
 * 
 * Environment Variables Required:
 * - REDIS_URL: Redis connection string (e.g., redis://localhost:6379)
 *   For production: Use Redis Cloud or AWS ElastiCache
 *   For development: Use local Redis or Upstash (free tier)
 */

import Redis from 'ioredis';

// Redis connection configuration
const redisConfig = {
  // Use Redis URL from environment (supports both redis:// and rediss:// protocols)
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // Connection options
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  
  // Retry strategy: exponential backoff
  retryStrategy(times: number) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  
  // Reconnect on error
  reconnectOnError(err: Error) {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      // Only reconnect when the error contains "READONLY"
      return true;
    }
    return false;
  }
};

// Create Redis client instance
let redisClient: Redis | null = null;

/**
 * Get or create Redis client
 * Singleton pattern to ensure single connection
 */
export const getRedisClient = (): Redis => {
  if (!redisClient) {
    redisClient = new Redis(redisConfig.url, {
      maxRetriesPerRequest: redisConfig.maxRetriesPerRequest,
      enableReadyCheck: redisConfig.enableReadyCheck,
      retryStrategy: redisConfig.retryStrategy,
      reconnectOnError: redisConfig.reconnectOnError,
    });

    // Event listeners for monitoring
    const logger = require('./logger').default;
    
    redisClient.on('connect', () => {
      logger.info('✅ Redis: Connected successfully');
    });

    redisClient.on('ready', () => {
      logger.info('✅ Redis: Ready to accept commands');
    });

    redisClient.on('error', (err) => {
      logger.error('❌ Redis Error:', { error: err.message });
    });

    redisClient.on('close', () => {
      logger.warn('⚠️  Redis: Connection closed');
    });

    redisClient.on('reconnecting', () => {
      logger.info('🔄 Redis: Reconnecting...');
    });
  }

  return redisClient;
};

/**
 * Close Redis connection gracefully
 * Call this on server shutdown
 */
export const closeRedisConnection = async (): Promise<void> => {
  if (redisClient) {
    const logger = require('./logger').default;
    await redisClient.quit();
    redisClient = null;
    logger.info('✅ Redis: Connection closed gracefully');
  }
};

/**
 * Check if Redis is connected and healthy
 */
export const isRedisHealthy = async (): Promise<boolean> => {
  try {
    const client = getRedisClient();
    const result = await client.ping();
    return result === 'PONG';
  } catch (error) {
    const logger = require('./logger').default;
    logger.error('Redis health check failed:', { error });
    return false;
  }
};

export default getRedisClient;
