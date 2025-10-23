# 🎯 Quick Test Reference Card

## 📥 Setup (Do Once)
1. Import `SaintsHub-API-Tests.postman_collection.json` into Postman
2. Update variables: `test_email` and `test_password`
3. Make sure server is running: `npm run dev`

---

## ⚡ Quick Test Sequence (5 minutes)

### 1️⃣ Health Check (30 seconds)
```
GET /health
✅ Status: 200
✅ All services healthy
```

### 2️⃣ Input Validation (1 minute)
```
POST /api/signup (invalid email)
❌ Status: 400 - Validation error ✓

POST /api/signup (weak password)  
❌ Status: 400 - Validation error ✓

POST /api/signup (valid)
✅ Status: 201 - User created ✓
```

### 3️⃣ Rate Limiting (1 minute)
```
Run folder "2. Rate Limiting Tests"
Requests 1-5: Pass (or 401)
Request 6: 429 Too Many Requests ✓
```

### 4️⃣ Token Blacklist (1 minute)
```
POST /api/signin
✅ Get token

POST /api/signout
✅ Token blacklisted

GET /api/dashboard/churches (with old token)
❌ 401 - Token is blacklisted ✓
```

### 5️⃣ Response Caching (1 minute)
```
GET /api/dashboard/churches
Response time: ~150ms (from DB)

GET /api/dashboard/churches (again)
Response time: <50ms (from cache) ✓
```

### 6️⃣ Error Handling (30 seconds)
```
GET /api/non-existent
✅ 404 - Consistent error format ✓

GET /api/dashboard/churches (no token)
✅ 401 - Unauthorized ✓
```

### 7️⃣ Check Logs (30 seconds)
```powershell
Get-Content logs\combined.log -Tail 10
✅ See all requests logged

Get-Content logs\error.log -Tail 5
✅ See only errors
```

---

## 🎨 Color-Coded Test Results

### 🟢 GREEN = Success!
- Feature is working correctly
- Production ready

### 🔴 RED = Failed
- Check server terminal
- Check `logs/error.log`
- Verify environment variables

### 🟡 YELLOW = Warning
- Feature works but slow
- May need optimization

---

## 📊 Expected Results Summary

| Feature | Test | Expected Result |
|---------|------|----------------|
| Health Check | GET /health | 200, all healthy |
| Input Validation | Invalid email | 400 error |
| Rate Limiting | 6th request | 429 too many |
| Token Blacklist | Use old token | 401 blacklisted |
| Response Caching | 2nd request | <50ms response |
| Error Handling | 404 route | Consistent format |
| Winston Logging | Check files | Logs present |
| DB Optimization | Any query | <200ms |

---

## 🚨 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| "Could not get response" | Run `npm run dev` |
| "Unauthorized" errors | Run Sign In first |
| Rate limit not working | Wait 15 min or restart |
| Cache not working | Check health endpoint |
| Token works after logout | Check Redis connection |

---

## 🎯 Success Criteria

✅ **All tests pass = Production Ready!**

**Minimum requirements:**
- [ ] Health check returns 200
- [ ] Rate limiting blocks 6th request
- [ ] Invalid data rejected (400)
- [ ] Logout blacklists token
- [ ] Cache speeds up 2nd request
- [ ] Errors are consistent
- [ ] Logs files created

---

## 📞 Test with Real Client

After Postman tests pass, test with:

### Frontend/Mobile App:
1. Sign up → Should get token
2. Sign in → Should get token
3. Create church → Should save
4. Get churches → Should list all
5. Sign out → Token should stop working

### ngrok (for mobile testing):
```bash
ngrok http 3003
```
Use the ngrok URL in your mobile app!

---

## 🏆 All 8 Features Tested

1. ✅ Redis Token Blacklist
2. ✅ Rate Limiting (429 on 6th request)
3. ✅ Input Validation (400 on invalid)
4. ✅ Error Handling (consistent format)
5. ✅ Winston Logging (files created)
6. ✅ Database Optimization (<200ms)
7. ✅ Response Caching (<50ms cached)
8. ✅ Health Check (all services healthy)

---

**Total Test Time: ~5 minutes**  
**Result: Production-Ready API! 🚀**
