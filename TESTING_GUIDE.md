# 🧪 Complete Testing Guide

## 📥 Import Postman Collection

### Step 1: Import the Collection
1. Open Postman
2. Click **Import** button (top left)
3. Select **File** tab
4. Choose: `SaintsHub-API-Tests.postman_collection.json`
5. Click **Import**

### Step 2: Set Up Environment Variables
After importing, update these variables in the collection:

1. Click on the collection name
2. Go to **Variables** tab
3. Update these values:

| Variable | Current Value | Description |
|----------|--------------|-------------|
| `base_url` | `http://localhost:3003` | Your server URL |
| `test_email` | Your email | Valid user email for login |
| `test_password` | Your password | Valid password for login |

**Save** the variables!

---

## 🎯 Testing Order & What Each Test Does

### ✅ Test 1: Health Check
**Location:** `0. Health & Status` → `Health Check`

**Purpose:** Verify all services are running

**What it tests:**
- ✅ Server is responding
- ✅ Database connected
- ✅ Redis Cloud connected
- ✅ Cache is working
- ✅ Memory usage
- ✅ System uptime

**Expected Response:**
```json
{
  "status": "ok",
  "services": {
    "database": { "status": "healthy", "connected": true },
    "redis": { "status": "healthy", "connected": true }
  }
}
```

**Pass Criteria:** Status 200, all services "healthy"

---

### ✅ Test 2: Input Validation
**Location:** `1. Authentication` → `Sign Up - Invalid Email`

**Purpose:** Test Feature #3 - Input Validation

**What it tests:**
- ❌ Invalid email format should be rejected
- ❌ Weak password should be rejected
- ✅ Valid data should be accepted

**Test Steps:**
1. Run `Sign Up - Invalid Email` → Expect 400 error
2. Run `Sign Up - Weak Password` → Expect 400 error
3. Run `Sign Up - Valid` → Expect 201 success

**Pass Criteria:** 
- Invalid requests return 400 with validation errors
- Valid request returns 201 with token

---

### ✅ Test 3: Rate Limiting
**Location:** `2. Rate Limiting Tests` → All 6 requests

**Purpose:** Test Feature #2 - Rate Limiting

**What it tests:**
- Auth routes limited to **5 requests per 15 minutes**
- 6th request should be blocked

**Test Steps:**
1. Select the **entire folder** "2. Rate Limiting Tests"
2. Click **Run** (Collection Runner)
3. Watch requests 1-5 succeed
4. Request 6 should return **429 Too Many Requests**

**Pass Criteria:** 
- Requests 1-5: Status 401 (wrong password is OK)
- Request 6: Status 429 "Too many requests"

**Rate Limits:**
- Auth routes: 5 requests / 15 minutes
- Upload routes: 20 requests / 15 minutes
- General API: 100 requests / 15 minutes

---

### ✅ Test 4: Redis Token Blacklist
**Location:** `1. Authentication` → Token blacklist tests

**Purpose:** Test Feature #1 - Redis Token Blacklist

**What it tests:**
- Logout adds token to Redis blacklist
- Blacklisted tokens cannot be used again

**Test Steps:**
1. Run `Sign In - Valid` → Save the token (auto-saved to `{{auth_token}}`)
2. Run `Sign Out (Token Blacklist Test)` → Token is blacklisted in Redis
3. Run `Use Blacklisted Token (Should Fail)` → Expect 401 "Token is blacklisted"

**Pass Criteria:**
- Sign out: 200 success
- Using blacklisted token: 401 unauthorized

**Behind the scenes:**
- Token is stored in Redis with key `blacklist:token`
- Token expires based on JWT expiration time
- Redis Cloud handles the storage

---

### ✅ Test 5: Response Caching
**Location:** `3. Church Management (CRUD)` → Cache tests

**Purpose:** Test Feature #7 - Response Caching

**What it tests:**
- First request: Fetches from database (slower)
- Second request: Returns cached data (faster)
- Cache TTL: 5 minutes
- Updates invalidate cache

**Test Steps:**
1. **First Request:** Run `Get All Churches (Cache Test 1)`
   - Note the response time (e.g., 150ms)
   - Data fetched from database
   
2. **Second Request:** Run `Get All Churches (Cache Test 2)` immediately
   - Response time should be much faster (< 50ms)
   - Data served from cache
   
3. **Cache Invalidation:** Run `Create Church`
   - Cache is cleared
   - Next GET request will fetch from DB again

**Pass Criteria:**
- Second request is significantly faster (< 100ms)
- Creating/updating/deleting church clears cache

**Cache Stats:** Check `/health` endpoint for cache statistics:
```json
{
  "cache": {
    "stats": {
      "keys": 1,
      "hits": 5,
      "misses": 1
    }
  }
}
```

---

### ✅ Test 6: Database Optimization
**Location:** Runs automatically with all requests

**Purpose:** Test Feature #6 - Database Indexes

**What it tests:**
- Fast queries with indexes on:
  - User: email, admin
  - Church: name, location, createdAt, user._id

**Test Steps:**
1. Run `Get All Churches` multiple times
2. Check response time

**Pass Criteria:**
- Church queries: < 200ms
- User lookups: < 100ms

**Indexes Created:**
```javascript
// User Model
email: { index: true, unique: true }
admin: { index: true }
{ email: 1, admin: 1 } // Compound index

// Space (Church) Model
name: { index: true }
location: { index: true }
createdAt: { index: true }
'user._id': { index: true }
{ location: 1, createdAt: -1 } // Compound index
```

---

### ✅ Test 7: Error Handling
**Location:** `4. Error Handling Tests` → All requests

**Purpose:** Test Feature #4 - Centralized Error Handling

**What it tests:**
- 404: Route not found
- 401: Unauthorized (no token)
- 400: Invalid data
- Consistent error format

**Test Steps:**
1. Run `404 - Route Not Found` → Expect consistent 404 format
2. Run `401 - Unauthorized` → Expect auth error
3. Run `400 - Invalid Church ID` → Expect validation error

**Pass Criteria:**
All errors return consistent format:
```json
{
  "error": "ErrorType",
  "message": "Human-readable message",
  "statusCode": 400
}
```

---

### ✅ Test 8: Winston Logging
**Location:** Runs automatically - check log files

**Purpose:** Test Feature #5 - Winston Logging

**What it tests:**
- All requests logged to files
- Errors logged separately
- Daily rotation working

**Test Steps:**
1. Run any request in Postman
2. Open `logs/combined.log` in VS Code
3. Check for request logs
4. Trigger an error and check `logs/error.log`

**Pass Criteria:**
- `logs/combined.log` contains all logs
- `logs/error.log` contains only errors
- Logs are formatted as JSON
- Files rotate daily

**Log Format:**
```json
{
  "level": "info",
  "message": "✅ Server is running on port 3003",
  "service": "saintshub-api",
  "timestamp": "2025-10-22 00:20:28"
}
```

---

## 📊 Complete Test Checklist

Run tests in this order:

- [ ] **1. Health Check** - Verify all services running
- [ ] **2. Input Validation** - Test 3 validation scenarios
- [ ] **3. Rate Limiting** - Run folder with 6 requests
- [ ] **4. Sign In** - Get fresh auth token
- [ ] **5. Response Caching** - Test cache hit/miss
- [ ] **6. Token Blacklist** - Sign out and test blacklisted token
- [ ] **7. Error Handling** - Test 3 error scenarios
- [ ] **8. Winston Logs** - Check log files in VS Code

---

## 🔧 Troubleshooting

### Issue: "Could not get any response"
**Solution:** Make sure server is running:
```bash
npm run dev
```
Check: http://localhost:3003/health

### Issue: "Unauthorized" errors
**Solution:** 
1. Run `Sign In - Valid` request first
2. Check `{{auth_token}}` variable is set
3. Make sure you haven't signed out yet

### Issue: Rate limiting not working
**Solution:**
1. Wait 15 minutes to reset counter
2. Or restart the server to clear rate limit

### Issue: Cache not clearing
**Solution:**
1. Restart server to clear cache
2. Cache auto-expires after 5 minutes

### Issue: Token still works after logout
**Solution:**
1. Check Redis is connected (run health check)
2. Verify Redis Cloud URL in `.env`
3. Check server logs for Redis connection

---

## 📈 Performance Benchmarks

Expected response times:

| Endpoint | First Request | Cached Request |
|----------|--------------|----------------|
| Health Check | < 100ms | N/A |
| Sign In | < 200ms | N/A |
| Get Churches | < 200ms | < 50ms |
| Create Church | < 300ms | N/A |
| Update Church | < 250ms | N/A |

---

## 🎓 Understanding Test Results

### ✅ Green Tests = Feature Working
When you see green checkmarks in Postman tests tab, that feature is working correctly!

### ❌ Red Tests = Something Wrong
If tests fail:
1. Check server logs in terminal
2. Check `logs/error.log` file
3. Verify environment variables
4. Check request body/headers

### Test Tab Example:
```
✓ Status code is 200
✓ Health status is ok
✓ Database is connected
✓ Redis is connected
```

---

## 📝 After Testing

### If All Tests Pass:
✅ Your API is production-ready!
✅ All 8 features working correctly
✅ Ready to deploy

### Next Steps:
1. Test with real mobile app/frontend
2. Set up monitoring (check health endpoint regularly)
3. Deploy to production
4. Configure production Redis Cloud
5. Set up SSL/HTTPS

---

## 🚀 Quick Test Commands

### Test from Terminal (Alternative to Postman):
```powershell
# Health Check
curl http://localhost:3003/health

# Sign Up
curl -X POST http://localhost:3003/api/signup -H "Content-Type: application/json" -d '{\"fullname\":\"Test User\",\"email\":\"test@test.com\",\"password\":\"SecurePass123!\",\"admin\":false}'

# Get Churches (with token)
curl http://localhost:3003/api/dashboard/churches -H "Authorization: Bearer YOUR_TOKEN"
```

---

**Happy Testing! 🎉**

If you find any issues, check:
1. Server terminal output
2. `logs/combined.log`
3. `logs/error.log`
4. Redis connection in health check
