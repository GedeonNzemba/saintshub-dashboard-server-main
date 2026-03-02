/**
 * Token Blacklist Service (In-Memory)
 *
 * Purpose: Manage invalidated JWT tokens to prevent reuse after logout.
 *
 * How it works:
 * 1. When a user logs out, their token is added to a Map with TTL
 * 2. The authMiddleware checks if a token exists before granting access
 * 3. Expired entries are cleaned up automatically every 10 minutes
 */

const blacklist = new Map<string, number>(); // token → expiresAt (ms)

// Cleanup expired tokens every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [token, expiresAt] of blacklist) {
    if (expiresAt <= now) {
      blacklist.delete(token);
    }
  }
}, 10 * 60 * 1000);

/**
 * Add a token to the blacklist
 */
export const addToBlacklist = async (token: string, expiresAt: number): Promise<void> => {
  blacklist.set(token, expiresAt);
};

/**
 * Check if a token is blacklisted
 */
export const isBlacklisted = async (token: string): Promise<boolean> => {
  const expiresAt = blacklist.get(token);
  if (expiresAt === undefined) return false;

  // Auto-cleanup if expired
  if (expiresAt <= Date.now()) {
    blacklist.delete(token);
    return false;
  }
  return true;
};

/**
 * Remove a token from the blacklist
 */
export const removeFromBlacklist = async (token: string): Promise<void> => {
  blacklist.delete(token);
};

/**
 * Get blacklist statistics
 */
export const getBlacklistStats = async (): Promise<{ totalTokens: number }> => {
  return { totalTokens: blacklist.size };
};

/**
 * Clear all blacklisted tokens
 */
export const clearAllBlacklistedTokens = async (): Promise<void> => {
  blacklist.clear();
};
