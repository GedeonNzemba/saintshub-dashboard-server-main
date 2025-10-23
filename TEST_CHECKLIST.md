# ✅ Postman Testing Checklist

Print this or keep it open while testing!

---

## 🎯 BEFORE YOU START

- [ ] Server is running (`npm run dev`)
- [ ] Imported Postman collection
- [ ] Updated `test_email` and `test_password` variables
- [ ] Server shows: "✅ Server is running on port 3003"

---

## 📋 TEST SEQUENCE

### ✅ TEST 1: HEALTH CHECK
**Run:** `0. Health & Status` → `Health Check`

Expected:
- [ ] Status: 200 ✅
- [ ] "status": "ok" ✅
- [ ] Database connected: true ✅
- [ ] Redis connected: true ✅

**Result:** ⬜ PASS / ⬜ FAIL

---

### ✅ TEST 2: INPUT VALIDATION

**Run:** `1. Authentication` → `Sign Up - Invalid Email`
- [ ] Status: 400 ✅
- [ ] Returns validation errors ✅

**Run:** `1. Authentication` → `Sign Up - Weak Password`
- [ ] Status: 400 ✅
- [ ] Returns validation errors ✅

**Run:** `1. Authentication` → `Sign Up - Valid`
- [ ] Status: 201 ✅
- [ ] Returns token ✅
- [ ] Token saved to `{{auth_token}}` ✅

**Result:** ⬜ PASS / ⬜ FAIL

---

### ✅ TEST 3: RATE LIMITING

**Run:** Entire folder `2. Rate Limiting Tests` using Collection Runner

- [ ] Request 1: Status 401 or 200 ✅
- [ ] Request 2: Status 401 or 200 ✅
- [ ] Request 3: Status 401 or 200 ✅
- [ ] Request 4: Status 401 or 200 ✅
- [ ] Request 5: Status 401 or 200 ✅
- [ ] Request 6: Status 429 "Too Many Requests" ✅

**Result:** ⬜ PASS / ⬜ FAIL

**Wait 15 minutes before testing rate limiting again!**

---

### ✅ TEST 4: AUTHENTICATION & TOKEN BLACKLIST

**Run:** `1. Authentication` → `Sign In - Valid`
- [ ] Status: 200 ✅
- [ ] Returns token ✅
- [ ] Token saved to `{{auth_token}}` ✅

**Run:** `1. Authentication` → `Sign Out (Token Blacklist Test)`
- [ ] Status: 200 ✅
- [ ] Message: "logged out" ✅

**Run:** `1. Authentication` → `Use Blacklisted Token (Should Fail)`
- [ ] Status: 401 ✅
- [ ] Message: "blacklisted" ✅

**Check server logs for:**
- [ ] "✅ Redis: Connected successfully" ✅
- [ ] "✅ Redis: Ready to accept commands" ✅

**Result:** ⬜ PASS / ⬜ FAIL

---

### ✅ TEST 5: RESPONSE CACHING

**Before starting, sign in again to get fresh token!**

**Run:** `3. Church Management (CRUD)` → `Get All Churches (Cache Test 1)`
- [ ] Status: 200 ✅
- [ ] Returns array of churches ✅
- [ ] Response time: _____ms (note this)

**Run:** `3. Church Management (CRUD)` → `Get All Churches (Cache Test 2)` IMMEDIATELY
- [ ] Status: 200 ✅
- [ ] Response time: _____ms (should be < 50ms) ✅
- [ ] Cached response is FASTER ✅

**Run:** `3. Church Management (CRUD)` → `Create Church`
- [ ] Status: 201 ✅
- [ ] Church ID saved to `{{church_id}}` ✅
- [ ] Cache should be cleared ✅

**Run:** `Get All Churches` again
- [ ] Response time back to normal (cache was cleared) ✅

**Result:** ⬜ PASS / ⬜ FAIL

---

### ✅ TEST 6: CRUD OPERATIONS

**Run:** `3. Church Management (CRUD)` → `Update Church`
- [ ] Status: 200 ✅
- [ ] Church updated successfully ✅

**Run:** `3. Church Management (CRUD)` → `Delete Church`
- [ ] Status: 200 ✅
- [ ] Church deleted successfully ✅

**Result:** ⬜ PASS / ⬜ FAIL

---

### ✅ TEST 7: ERROR HANDLING

**Run:** `4. Error Handling Tests` → `404 - Route Not Found`
- [ ] Status: 404 ✅
- [ ] Consistent error format ✅

**Run:** `4. Error Handling Tests` → `401 - Unauthorized (No Token)`
- [ ] Status: 401 ✅
- [ ] Error message present ✅

**Run:** `4. Error Handling Tests` → `400 - Invalid Church ID Format`
- [ ] Status: 400 or 404 ✅
- [ ] Error message present ✅

**Result:** ⬜ PASS / ⬜ FAIL

---

### ✅ TEST 8: WINSTON LOGGING

**Open VS Code and check log files:**

**File:** `logs/combined.log`
- [ ] File exists ✅
- [ ] Contains recent requests ✅
- [ ] JSON formatted logs ✅

**File:** `logs/error.log`
- [ ] File exists ✅
- [ ] Contains only errors (may be empty) ✅

**In PowerShell/Terminal:**
```powershell
Get-Content logs\combined.log -Tail 10
```
- [ ] See your recent API requests ✅

**Result:** ⬜ PASS / ⬜ FAIL

---

### ✅ TEST 9: DATABASE OPTIMIZATION

**Review all previous church queries:**
- [ ] All church queries completed in < 200ms ✅
- [ ] Sign in queries completed in < 100ms ✅

**Result:** ⬜ PASS / ⬜ FAIL

---

## 📊 FINAL RESULTS

| Feature | Status | Notes |
|---------|--------|-------|
| Health Check | ⬜ PASS / ⬜ FAIL | |
| Input Validation | ⬜ PASS / ⬜ FAIL | |
| Rate Limiting | ⬜ PASS / ⬜ FAIL | |
| Token Blacklist | ⬜ PASS / ⬜ FAIL | |
| Response Caching | ⬜ PASS / ⬜ FAIL | |
| CRUD Operations | ⬜ PASS / ⬜ FAIL | |
| Error Handling | ⬜ PASS / ⬜ FAIL | |
| Winston Logging | ⬜ PASS / ⬜ FAIL | |
| DB Optimization | ⬜ PASS / ⬜ FAIL | |

---

## 🎉 SUCCESS CRITERIA

**All tests must PASS for production deployment!**

Total Features Tested: 8/8
Status: ⬜ PRODUCTION READY / ⬜ NEEDS FIXES

---

## 🐛 IF ANY TESTS FAIL

1. **Check server terminal output**
   ```bash
   # Look for errors in red
   ```

2. **Check error logs**
   ```powershell
   Get-Content logs\error.log -Tail 20
   ```

3. **Check environment variables**
   - `.env` file has REDIS_URL
   - MongoDB connection working
   - JWT_SECRET is set

4. **Restart server**
   ```bash
   npm run dev
   ```

5. **Check Redis Cloud connection**
   - Run health check
   - Verify Redis status is "healthy"

---

## 📝 NOTES SECTION

Use this space for any issues or observations:

```
_________________________________________________________________

_________________________________________________________________

_________________________________________________________________

_________________________________________________________________

_________________________________________________________________
```

---

**Test Date:** _________________  
**Tested By:** _________________  
**Server Version:** 1.0.0  
**Status:** ⬜ READY FOR PRODUCTION  

---

**🎯 Target: 9/9 PASS = Production Ready! 🚀**
