# 🚀 Redis Token Blacklist Implementation Guide

## ✅ What Was Implemented

Replaced in-memory token blacklist with **Redis-based persistent storage** for production scalability.

### Files Created/Modified:
1. ✅ `src/utils/redis.ts` - Redis client configuration
2. ✅ `src/utils/tokenBlacklist.ts` - Redis-based token blacklist (async)
3. ✅ `src/middlewares/authMiddleware.ts` - Updated to use async blacklist check
4. ✅ `src/controllers/userController.ts` - Updated logout & deleteAccount to use async blacklist
5. ✅ `.env.example` - Redis configuration template

---

## 🔧 Setup Instructions

### Option 1: Local Development (Redis on your machine)

**Install Redis locally:**

**Windows:**
```powershell
# Using Chocolatey
choco install redis-64

# Or download from: https://github.com/microsoftarchive/redis/releases
```

**Mac:**
```bash
brew install redis
brew services start redis
```

**Linux:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

**Add to your `.env` file:**
```env
REDIS_URL=redis://localhost:6379
```

---

### Option 2: Production (Redis Cloud - FREE TIER) ⭐ RECOMMENDED

**Why Redis Cloud?**
- ✅ 30MB free forever
- ✅ No credit card required
- ✅ High availability
- ✅ SSL/TLS encryption

**Setup Steps:**

1. **Sign up**: https://redis.com/try-free/
2. **Create Free Database**:
   - Name: `saintshub-tokens`
   - Cloud: AWS / GCP / Azure (pick closest region)
   - Plan: **Free 30MB**
3. **Get Connection String**:
   - Go to database → Configuration
   - Copy "Public endpoint" (format: `redis-12345.c123.us-east-1-1.ec2.cloud.redislabs.com:12345`)
   - Get password from "Security" tab
4. **Add to `.env` file**:
```env
REDIS_URL=redis://default:YOUR_PASSWORD@redis-12345.c123.us-east-1-1.ec2.cloud.redislabs.com:12345
```

---

### Option 3: Serverless Redis (Upstash - FREE TIER)

**Why Upstash?**
- ✅ 10,000 commands/day free
- ✅ Perfect for serverless/Vercel
- ✅ Global edge locations

**Setup Steps:**

1. **Sign up**: https://upstash.com
2. **Create Database**:
   - Type: **Global** (multi-region) or **Regional**
   - Enable TLS: ✅
3. **Copy Connection String**:
```env
REDIS_URL=rediss://default:YOUR_PASSWORD@global-usable-12345.upstash.io:6379
```

---

## 🧪 Testing the Implementation

### 1. Start your server:
```bash
npm run dev
```

**Expected console output:**
```
✅ Redis: Connected successfully
✅ Redis: Ready to accept commands
Server is running on port 3003
```

### 2. Test in Postman:

**Login:**
```
POST {{base_url}}/api/auth/login
{
  "email": "user@example.com",
  "password": "yourpassword"
}
```
Copy the `token` from response.

**Logout (Blacklist token):**
```
POST {{base_url}}/api/auth/logout
Headers:
  Authorization: Bearer YOUR_TOKEN
```

**Try using the same token again:**
```
GET {{base_url}}/api/user
Headers:
  Authorization: Bearer YOUR_TOKEN
```

**Expected Response:**
```json
{
  "message": "Token has been invalidated. Please log in again.",
  "reason": "logout"
}
```

✅ **Success!** Token is blacklisted in Redis.

---

## 📊 Benefits Over In-Memory Blacklist

| Feature | In-Memory (Old) | Redis (New) |
|---------|----------------|-------------|
| **Survives server restart** | ❌ No | ✅ Yes |
| **Works with multiple servers** | ❌ No | ✅ Yes |
| **Auto cleanup expired tokens** | Manual (setInterval) | ✅ Automatic (TTL) |
| **Scalability** | Limited to 1 server | ✅ Unlimited |
| **Production ready** | ❌ No | ✅ Yes |

---

## 🔍 Monitoring Redis

**Check blacklist stats:**

Add this temporary route to `src/index.ts` for debugging:
```typescript
import { getBlacklistStats } from './utils/tokenBlacklist';

app.get('/api/admin/blacklist-stats', async (req, res) => {
  const stats = await getBlacklistStats();
  res.json(stats);
});
```

**Response:**
```json
{
  "totalTokens": 12
}
```

---

## 🐛 Troubleshooting

### Error: "Redis connection failed"

**Check:**
1. Is Redis running? (`redis-cli ping` should return `PONG`)
2. Is `REDIS_URL` in your `.env` file?
3. Is the connection string correct?

**Solution:**
```bash
# Test Redis connection
redis-cli -u redis://localhost:6379 ping
```

### Error: "ECONNREFUSED"

**Cause:** Redis server not running

**Solution:**
```bash
# Windows
redis-server

# Mac
brew services start redis

# Linux
sudo systemctl start redis
```

### Using without Redis (fallback)

If Redis is unavailable, the code will log errors but **won't crash**. However, tokens won't be blacklisted (security risk). Always use Redis in production.

---

## 🚀 Production Checklist

Before deploying:

- [ ] `REDIS_URL` added to production environment variables
- [ ] Redis Cloud or Upstash account created
- [ ] Connection tested successfully
- [ ] Server logs show "✅ Redis: Connected successfully"
- [ ] Logout flow tested and working

---

## 💰 Cost

**Development:** FREE (local Redis)  
**Production:** FREE (Redis Cloud 30MB or Upstash 10k commands/day)

No credit card needed! 🎉

---

## 📝 Next Steps

After Redis is set up, proceed to:
- ✅ **Task 2:** Rate limiting middleware
- ✅ **Task 3:** Input validation
- ✅ **Task 4:** Error handling middleware

---

**Need help?** Check Redis logs in your server console or contact support.
