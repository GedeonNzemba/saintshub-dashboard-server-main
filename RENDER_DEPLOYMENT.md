# 🚀 Deploy SaintsHub API to Render.com

**Step-by-step guide for deploying to Render**

---

## ✅ Why Render is Great for This Project

- ✅ **Persistent Node.js server** (not serverless)
- ✅ **Free tier available** (no credit card needed)
- ✅ **No execution time limits**
- ✅ **Automatic SSL certificates**
- ✅ **Auto-deploy from GitHub**
- ✅ **No cold starts on paid tier** ($7/month)
- ✅ **PostgreSQL/Redis hosting included**

---

## 📋 Pre-Deployment Checklist

### 1. Verify Your Code is Ready

- [x] MongoDB connection string uses environment variable
- [x] Email service configured (Hostinger SMTP)
- [x] Cloudinary configured for file uploads
- [x] All secrets in .env (not hardcoded)
- [x] CORS configured
- [x] Build script exists in package.json

---

## 🚀 Deployment Steps

### Step 1: Sign Up for Render

1. Go to **https://render.com**
2. Click **"Get Started for Free"**
3. Sign up with **GitHub** (recommended)
4. Authorize Render to access your repositories

---

### Step 2: Create New Web Service

1. From Render Dashboard, click **"New +"** button
2. Select **"Web Service"**
3. Click **"Connect a repository"**
4. Find and select: **`saintshub-dashboard-server-main`**
5. Click **"Connect"**

---

### Step 3: Configure Your Service

Fill in the following settings:

#### Basic Settings

| Field | Value |
|-------|-------|
| **Name** | `saintshub-api` |
| **Region** | Choose closest to your users (e.g., Oregon USA, Frankfurt EU) |
| **Branch** | `main` |
| **Root Directory** | Leave empty (unless your code is in a subfolder) |
| **Runtime** | `Node` |

#### Build & Deploy Settings

| Field | Value |
|-------|-------|
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |

**Note:** Make sure your `package.json` has these scripts:

```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "nodemon"
  }
}
```

#### Instance Type

| Field | Value |
|-------|-------|
| **Plan** | `Free` (for testing) or `Starter ($7/mo)` (for production) |

**Free Tier Limitations:**
- ⚠️ Service sleeps after 15 minutes of inactivity
- ⚠️ 750 hours/month limit
- ⚠️ First request after sleep takes ~30 seconds

**Starter Plan Benefits:**
- ✅ No sleep
- ✅ Always available
- ✅ Faster performance
- ✅ Custom domains

---

### Step 4: Add Environment Variables

Scroll down to **"Environment Variables"** section.

Click **"Add Environment Variable"** for each of these:

```bash
# Database
MONGODB_URI=mongodb+srv://medeon:Medeon123@cluster0.4fqga.mongodb.net/saintsHub

# Server
NODE_ENV=production
JWT_SECRET=8b4061ff56160f352be1233f6138b39824a026de71dc75cfd347e7f9b33450be9a9f0d7d865ab903177879ae8629e7458d7a405195149a0c0b5f22a95d0852d1

# Email Configuration (Hostinger)
EMAIL_HOST=smtp.hostinger.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=saintshub@gedeonchrist.com
EMAIL_PASS=M#deon@102030

# Email Addresses
EMAIL_FROM_NOREPLY=SaintsHub <saintshub@gedeonchrist.com>
EMAIL_FROM_ADMIN=SaintsHub Admin <saintshub@gedeonchrist.com>
ADMIN_NOTIFICATION_EMAIL=saintshub@gedeonchrist.com

# Frontend URL (update after deploying frontend)
FRONTEND_URL=https://your-frontend-url.vercel.app

# Brand Assets
BRAND_LOGO_URL=https://res.cloudinary.com/locataire/image/upload/v1744489734/Screenshot_2025-04-12_222728_i2fm7v.png
BRAND_COLOR_PRIMARY=#6366f1
BRAND_COLOR_SECONDARY=#4f46e5
BRAND_WEBSITE_URL=https://www.gedeonchrist.com/saintshub
BRAND_APP_URL=https://app.saintshub.com
BRAND_DASHBOARD_URL=https://admin.saintshub.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=ddbiofmni
CLOUDINARY_API_KEY=629285927862696
CLOUDINARY_API_SECRET=7i7owfVVo3t860usBWvJqTITMHY

# Redis (Optional - for token blacklist)
REDIS_URL=redis://default:2jb3SoOuo4LUQ2Rw68RMhLxElR4aKPLt@redis-19140.c57.us-east-1-4.ec2.redns.redis-cloud.com:19140
```

**⚠️ Important Notes:**
- Don't include quotes around values in Render (unlike .env file)
- Example: Use `M#deon@102030` NOT `"M#deon@102030"`
- Render automatically handles special characters

---

### Step 5: Advanced Settings (Optional)

Scroll down to **"Advanced"** section:

#### Health Check Path
Set to: `/health`

This allows Render to monitor your API and restart if it crashes.

#### Auto-Deploy
Enable **"Auto-Deploy"** → Yes

This will automatically redeploy when you push to GitHub.

---

### Step 6: Create Web Service

1. Review all settings
2. Click **"Create Web Service"** button
3. Render will start building and deploying your app

You'll see:
```
Building...
Deploying...
Live ✓
```

---

## 🎯 After Deployment

### Your API URL

Render will give you a URL like:

```
https://saintshub-api.onrender.com
```

### Test Your API

```bash
# 1. Health check
curl https://saintshub-api.onrender.com/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-10-23T...",
  "database": "connected",
  "email": "configured"
}

# 2. Test signup
curl -X POST https://saintshub-api.onrender.com/api/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test",
    "surname": "User",
    "email": "test@example.com",
    "password": "Test123!",
    "confirmPassword": "Test123!",
    "avatar": "https://randomuser.me/api/portraits/men/1.jpg",
    "language": "en",
    "role": "user",
    "selectedChurchId": "",
    "otherChurchName": ""
  }'

# 3. Test signin
curl -X POST https://saintshub-api.onrender.com/api/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'
```

---

## 🔧 Update Your React Native App

After deployment, update your React Native app configuration:

### File: `src/config/api.js`

```javascript
const ENV = {
  dev: {
    apiUrl: 'http://localhost:3003',
  },
  staging: {
    apiUrl: 'https://saintshub-api-staging.onrender.com', // If you create staging
  },
  prod: {
    apiUrl: 'https://saintshub-api.onrender.com', // Your Render URL
  },
};

const getEnvVars = (env = Constants.manifest?.releaseChannel) => {
  if (__DEV__) {
    return ENV.dev;
  } else if (env === 'staging') {
    return ENV.staging;
  } else if (env === 'prod') {
    return ENV.prod;
  }
  return ENV.dev;
};

export default getEnvVars();
```

---

## 📊 Monitoring Your App

### View Logs

1. Go to Render Dashboard
2. Click on your service: `saintshub-api`
3. Click **"Logs"** tab
4. See real-time logs

### Useful Log Commands

Filter logs:
- Click filter icon
- Search for errors, warnings, etc.

### Metrics

Click **"Metrics"** tab to see:
- CPU usage
- Memory usage
- Request count
- Response times

---

## 🔄 Deploying Updates

### Option 1: Auto-Deploy (Recommended)

Just push to GitHub:

```bash
git add .
git commit -m "Update API"
git push origin main
```

Render automatically detects the push and redeploys! ✨

### Option 2: Manual Deploy

1. Go to Render Dashboard
2. Click on your service
3. Click **"Manual Deploy"** button
4. Select branch
5. Click **"Deploy"**

---

## 🌐 Custom Domain (Optional)

### Step 1: Add Domain in Render

1. Go to your service settings
2. Click **"Custom Domains"**
3. Click **"Add Custom Domain"**
4. Enter: `api.saintshub.com`

### Step 2: Update DNS

Render will show you DNS records to add:

**For apex domain (api.saintshub.com):**
- Type: `CNAME`
- Name: `api`
- Value: `saintshub-api.onrender.com`

**Or for subdomain:**
- Type: `A`
- Name: `@`
- Value: Render's IP address

### Step 3: Wait for SSL

Render automatically provisions SSL certificate (can take 5-30 minutes).

Your API will be available at: `https://api.saintshub.com`

---

## 🐛 Troubleshooting

### Issue: Build Failed

**Check:**
1. Build command is correct: `npm install && npm run build`
2. `package.json` has `build` script
3. TypeScript compiles without errors locally

**Solution:**
```bash
# Test build locally
npm run build

# Fix any TypeScript errors
# Then push again
```

### Issue: Service Crashes on Start

**Check:**
1. Start command is correct: `npm start`
2. Check logs for error message
3. Verify environment variables are set

**Common causes:**
- Missing environment variables
- MongoDB connection failed
- Port binding issues (Render provides PORT automatically)

### Issue: Database Connection Failed

**Check:**
1. MongoDB Atlas network access
2. Add `0.0.0.0/0` to IP whitelist (allow all IPs)
3. Verify `MONGODB_URI` is correct

**Solution:**
1. Go to MongoDB Atlas
2. Network Access → Add IP Address
3. Allow access from anywhere: `0.0.0.0/0`

### Issue: Emails Not Sending

**Check:**
1. Email environment variables are set correctly
2. No quotes around values in Render
3. Hostinger SMTP credentials are valid

**Test SMTP:**
- Check Render logs for email errors
- Verify Hostinger account is active

### Issue: CORS Errors

**Solution:**

Update `src/index.ts`:

```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
```

Then update `FRONTEND_URL` environment variable in Render to your actual frontend URL.

### Issue: Free Tier Sleeps

**Symptoms:**
- First request after 15 minutes is slow (~30 seconds)
- App seems "down" until first request

**Solutions:**

1. **Upgrade to Starter ($7/mo)** - No sleep, always available

2. **Use Cron Job to Keep Alive** (Free tier hack):
   ```bash
   # Use a service like cron-job.org
   # Ping your API every 10 minutes
   GET https://saintshub-api.onrender.com/health
   ```

3. **Accept the limitation** - Fine for development/testing

---

## 💰 Pricing

### Free Tier
- **Cost:** $0
- **Hours:** 750 hours/month
- **Sleep:** After 15 minutes inactivity
- **Memory:** 512 MB
- **Best for:** Development, testing, low-traffic apps

### Starter
- **Cost:** $7/month
- **Hours:** Unlimited
- **Sleep:** Never
- **Memory:** 512 MB
- **Best for:** Production apps

### Standard
- **Cost:** $25/month
- **Memory:** 2 GB
- **Features:** Faster CPU, more memory
- **Best for:** High-traffic production apps

---

## 🔐 Security Best Practices

### Before Going to Production

1. **Update CORS:**
   ```typescript
   app.use(cors({
     origin: process.env.FRONTEND_URL, // NOT '*'
     credentials: true
   }));
   ```

2. **Verify Environment Variables:**
   - All secrets are in Render, not in code
   - Strong JWT_SECRET (already good ✓)
   - No .env file committed to GitHub

3. **MongoDB Security:**
   - Whitelist only necessary IPs (or 0.0.0.0/0 for Render)
   - Use strong database password
   - Regular backups enabled

4. **SSL/HTTPS:**
   - Render provides this automatically ✓

5. **Rate Limiting:**
   - Already configured in your app ✓
   - Monitor for abuse

---

## 📈 Performance Tips

### 1. Use Starter Plan for Production
Free tier sleeps = bad user experience. $7/month is worth it.

### 2. Enable HTTP/2
Render enables this automatically for better performance.

### 3. Monitor Response Times
Use Render Metrics tab to track performance.

### 4. Optimize Database Queries
- Use indexes in MongoDB
- Limit returned fields
- Paginate large results

### 5. Cache with Redis
Already configured in your project! Redis URL is set.

---

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] Code is committed to GitHub
- [ ] `.env` file is in `.gitignore`
- [ ] Build script works locally (`npm run build`)
- [ ] MongoDB Atlas allows connections from anywhere
- [ ] Cloudinary credentials are correct

### During Deployment
- [ ] Web Service created on Render
- [ ] All environment variables added (no quotes!)
- [ ] Build command: `npm install && npm run build`
- [ ] Start command: `npm start`
- [ ] Health check path: `/health`
- [ ] Auto-deploy enabled

### Post-Deployment
- [ ] Health check passes (`/health`)
- [ ] Signup endpoint works
- [ ] Signin endpoint works
- [ ] Emails are sent successfully
- [ ] Protected routes work with token
- [ ] File uploads work (Cloudinary)
- [ ] Logs show no errors
- [ ] React Native app updated with Render URL

---

## 🎉 You're Live!

Once deployed, your API will be available at:

```
https://saintshub-api.onrender.com
```

### Share Your API

Update your documentation with the production URL:
- React Native app config
- Postman collections
- API documentation
- Team members

### Monitor Performance

Check Render dashboard regularly:
- Response times
- Error rates
- Memory usage
- Request volume

### Keep Improving

- Monitor logs for errors
- Optimize slow endpoints
- Add more features
- Scale as needed

---

## 📞 Support

**Render Documentation:** https://render.com/docs  
**Render Community:** https://community.render.com  
**Status Page:** https://status.render.com

**Your Project:**
- Backend: `C:\Users\nzemb\OneDrive\Documents\Web Development\Projects\saintshub-dashboard-server-main`
- Frontend: `C:\Users\nzemb\Documents\saintshub-v3\saintshub`

---

## 🚀 Next Steps

1. **Deploy to Render** (follow steps above)
2. **Test all endpoints** with your Render URL
3. **Update React Native app** with production URL
4. **Deploy React Native app** to Expo
5. **Go live!** 🎉

---

**Ready to deploy? Let's do this! 🚀**

**Last Updated:** October 23, 2025  
**Platform:** Render.com  
**Cost:** Free tier available, $7/mo Starter recommended
