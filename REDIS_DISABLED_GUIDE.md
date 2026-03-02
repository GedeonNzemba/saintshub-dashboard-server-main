# Redis Disabled - Quick Guide

## Problem Solved ✅

The infinite Redis reconnection loop has been **completely disabled**. Your server will no longer spam logs trying to reconnect to an unavailable Redis instance.

---

## What Changed

### 1. **Redis Client (`utils/redis.ts`)**
- ✅ Retries disabled (`maxRetriesPerRequest: 0`)
- ✅ Reconnection disabled (`retryStrategy: false`)
- ✅ Auto-reconnect disabled (`reconnectOnError: false`)
- ✅ Lazy connect enabled (won't attempt connection on startup)
- ✅ Returns `null` if Redis is unavailable

### 2. **Token Blacklist (`utils/tokenBlacklist.ts`)**
- ✅ Checks if Redis is available before operations
- ✅ Gracefully degrades when Redis is unavailable
- ✅ Logs warnings instead of errors
- ✅ All functions handle `null` Redis client

---

## How to Completely Disable Redis

### Option 1: Remove REDIS_URL (Recommended)
In your `.env` file, **delete or comment out** the `REDIS_URL` line:

```bash
# REDIS_URL=redis://redis-19140.c57.us-east-1-4.ec2.redns.redis-cloud.com:19140
```

### Option 2: Set REDIS_DISABLED Flag
Add this to your `.env` file:

```bash
REDIS_DISABLED=true
```

---

## After Disabling Redis

### ✅ What Still Works
- ✅ Authentication (JWT tokens)
- ✅ Login/signup
- ✅ All API endpoints
- ✅ Database operations
- ✅ File uploads
- ✅ Everything except token blacklist

### ⚠️ What Doesn't Work
- ❌ **Token Blacklist**: Logout won't immediately invalidate tokens
  - Tokens remain valid until their natural expiration (e.g., 7 days)
  - This is acceptable for development or single-user systems

---

## Restart Your Server

After editing `.env`:

```bash
# Stop the server (Ctrl+C)
# Then restart:
cd servers/app
npm run dev
```

You should now see:
```
⚠️  Redis: DISABLED (no REDIS_URL configured or REDIS_DISABLED=true)
```

**No more reconnection logs!** ✅

---

## Production Recommendations

If you need token blacklist in production:

1. **Use Upstash (Free Tier)**
   - https://upstash.com
   - Free 10,000 commands/day
   - No credit card required

2. **Use Redis Cloud (Free Tier)**
   - https://redis.com/try-free/
   - 30MB free storage

---

## Testing

Test that your app works without Redis:

```bash
# 1. Test login
POST http://localhost:3003/api/auth/signin

# 2. Test authenticated endpoint
GET http://localhost:3003/api/churches
Authorization: Bearer <your_token>

# 3. Test logout (token won't be blacklisted, but endpoint works)
POST http://localhost:3003/api/auth/signout
Authorization: Bearer <your_token>
```

All endpoints should work normally!

---

## Need Help?

If you see any errors after this change, check:
1. ✅ `.env` file updated (REDIS_URL removed or REDIS_DISABLED=true)
2. ✅ Server restarted
3. ✅ No syntax errors in `utils/redis.ts` or `utils/tokenBlacklist.ts`
