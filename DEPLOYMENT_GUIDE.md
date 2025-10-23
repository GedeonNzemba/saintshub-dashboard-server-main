# 🚀 SaintsHub API Deployment Guide

**Complete guide for deploying SaintsHub backend to various platforms**

---

## 📋 Table of Contents

1. [Platform Comparison](#platform-comparison)
2. [Vercel Deployment](#vercel-deployment-serverless)
3. [Railway Deployment](#railway-deployment-recommended)
4. [Render Deployment](#render-deployment)
5. [Environment Variables](#environment-variables)
6. [Post-Deployment Setup](#post-deployment-setup)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Platform Comparison

### Vercel (Serverless)

**Pros:**
- ✅ Free tier available
- ✅ Fast deployment via Git
- ✅ Automatic SSL
- ✅ Good for API routes
- ✅ Great CDN

**Cons:**
- ❌ 10s execution limit (Hobby)
- ❌ No persistent connections
- ❌ Cold starts
- ❌ No WebSockets
- ❌ Local file storage won't work

**Best for:** Lightweight APIs, serverless functions, static sites with API routes

---

### Railway (Recommended for This Project)

**Pros:**
- ✅ Persistent Node.js server
- ✅ WebSocket support
- ✅ No execution time limits
- ✅ Simple deployment
- ✅ Database hosting included
- ✅ Automatic SSL
- ✅ $5 free credit monthly

**Cons:**
- ❌ ~$5/month after free credit
- ❌ Requires payment method

**Best for:** Full Node.js/Express applications (THIS ONE!)

---

### Render

**Pros:**
- ✅ Free tier available
- ✅ Persistent server
- ✅ No execution limits
- ✅ Database hosting
- ✅ Automatic SSL
- ✅ No credit card needed (free tier)

**Cons:**
- ❌ Free tier sleeps after inactivity
- ❌ 750 hours/month limit on free

**Best for:** Production apps with budget constraints

---

## 🔧 Vercel Deployment (Serverless)

### Prerequisites

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login
```

### Step 1: Update Package.json

Add build script if not present:

```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "nodemon"
  }
}
```

### Step 2: Vercel Configuration

File `vercel.json` is already configured:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/index.ts"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### Step 3: Deploy

```bash
# Navigate to project directory
cd C:\Users\nzemb\OneDrive\Documents\Web Development\Projects\saintshub-dashboard-server-main

# Deploy to Vercel
vercel

# For production
vercel --prod
```

### Step 4: Set Environment Variables

In Vercel Dashboard (https://vercel.com/dashboard):

1. Go to your project
2. Settings → Environment Variables
3. Add all variables from `.env`:

```
MONGODB_URI=mongodb+srv://medeon:Medeon123@cluster0.4fqga.mongodb.net/saintsHub
JWT_SECRET=your-secret-key
EMAIL_HOST=smtp.hostinger.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=saintshub@gedeonchrist.com
EMAIL_PASS=M#deon@102030
EMAIL_FROM_NOREPLY=SaintsHub <saintshub@gedeonchrist.com>
EMAIL_FROM_ADMIN=SaintsHub Admin <saintshub@gedeonchrist.com>
ADMIN_NOTIFICATION_EMAIL=saintshub@gedeonchrist.com
FRONTEND_URL=https://your-frontend-url.vercel.app
BRAND_LOGO_URL=https://res.cloudinary.com/locataire/image/upload/v1744489734/Screenshot_2025-04-12_222728_i2fm7v.png
BRAND_COLOR_PRIMARY=#6366f1
BRAND_COLOR_SECONDARY=#4f46e5
CLOUDINARY_CLOUD_NAME=ddbiofmni
CLOUDINARY_API_KEY=629285927862696
CLOUDINARY_API_SECRET=7i7owfVVo3t860usBWvJqTITMHY
```

### Step 5: Update CORS

In `src/index.ts`, update CORS for production:

```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
```

### Limitations on Vercel

⚠️ **Important Limitations:**
- Execution timeout: 10 seconds (Hobby), 60 seconds (Pro)
- Cold starts: First request after inactivity will be slow
- No persistent connections
- No local file storage (must use Cloudinary for all uploads)

---

## 🚂 Railway Deployment (RECOMMENDED)

### Why Railway is Best for This Project

- ✅ Persistent Node.js server
- ✅ No execution time limits
- ✅ WebSocket support (for future features)
- ✅ Simple deployment
- ✅ $5 free credit monthly

### Step 1: Sign Up

1. Go to https://railway.app
2. Sign up with GitHub
3. Verify your account

### Step 2: Create New Project

```bash
# Install Railway CLI (optional)
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Link to GitHub repo
railway link
```

Or use Railway Dashboard:
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Connect your GitHub account
4. Select `saintshub-dashboard-server-main` repo

### Step 3: Configure Environment Variables

In Railway Dashboard:

1. Click on your service
2. Go to "Variables" tab
3. Add all environment variables from `.env`

Or via CLI:

```bash
railway variables set MONGODB_URI="mongodb+srv://medeon:Medeon123@cluster0.4fqga.mongodb.net/saintsHub"
railway variables set JWT_SECRET="your-secret-key"
railway variables set EMAIL_HOST="smtp.hostinger.com"
# ... add all others
```

### Step 4: Deploy

Railway auto-deploys when you push to GitHub!

```bash
git add .
git commit -m "Ready for Railway deployment"
git push origin main
```

Railway will:
1. Detect Node.js project
2. Run `npm install`
3. Run `npm run build` (if build script exists)
4. Start with `npm start`

### Step 5: Get Your URL

Railway provides a URL like: `https://saintshub-api-production.up.railway.app`

Update `FRONTEND_URL` in your environment variables to match your React Native app.

### Step 6: Custom Domain (Optional)

1. In Railway Dashboard → Settings → Domains
2. Add custom domain: `api.saintshub.com`
3. Update DNS records as instructed

---

## 🎨 Render Deployment

### Step 1: Sign Up

1. Go to https://render.com
2. Sign up with GitHub
3. Verify email

### Step 2: Create Web Service

1. Click "New +" → "Web Service"
2. Connect GitHub repository
3. Select `saintshub-dashboard-server-main`

### Step 3: Configure Service

**Settings:**
- **Name:** saintshub-api
- **Environment:** Node
- **Region:** Choose closest to users
- **Branch:** main
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`
- **Instance Type:** Free

### Step 4: Add Environment Variables

In "Environment" tab, add all variables from `.env`

### Step 5: Deploy

Click "Create Web Service" - Render will deploy automatically!

**Your URL:** `https://saintshub-api.onrender.com`

⚠️ **Free Tier Note:** Service sleeps after 15 minutes of inactivity. First request after sleep takes ~30 seconds.

---

## 📝 Environment Variables Checklist

Make sure ALL these are set in your deployment platform:

```bash
# Database
✅ MONGODB_URI

# Server
✅ JWT_SECRET
✅ NODE_ENV=production
✅ PORT (usually auto-set by platform)

# Email (Hostinger SMTP)
✅ EMAIL_HOST
✅ EMAIL_PORT
✅ EMAIL_SECURE
✅ EMAIL_USER
✅ EMAIL_PASS
✅ EMAIL_FROM_NOREPLY
✅ EMAIL_FROM_ADMIN
✅ ADMIN_NOTIFICATION_EMAIL

# Frontend
✅ FRONTEND_URL

# Branding
✅ BRAND_LOGO_URL
✅ BRAND_COLOR_PRIMARY
✅ BRAND_COLOR_SECONDARY
✅ BRAND_WEBSITE_URL
✅ BRAND_APP_URL
✅ BRAND_DASHBOARD_URL

# Cloudinary
✅ CLOUDINARY_CLOUD_NAME
✅ CLOUDINARY_API_KEY
✅ CLOUDINARY_API_SECRET

# Redis (if using)
✅ REDIS_URL (optional)
```

---

## 🔐 Security Checklist

Before deploying to production:

### 1. Update CORS

```typescript
// src/index.ts
app.use(cors({
  origin: process.env.FRONTEND_URL, // NOT '*'
  credentials: true
}));
```

### 2. Secure Cookies

```typescript
res.cookie("token", token, { 
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // HTTPS only in production
  sameSite: 'strict'
});
```

### 3. Environment Variables

- ✅ Never commit `.env` to Git
- ✅ Use strong JWT_SECRET (min 32 characters)
- ✅ Rotate secrets regularly
- ✅ Use different secrets for dev/prod

### 4. Rate Limiting

Already configured in your project:
- Auth routes: 5 requests/15 minutes
- Upload routes: 20 requests/15 minutes
- General API: 100 requests/15 minutes

### 5. Database Security

- ✅ MongoDB Atlas already uses SSL
- ✅ Whitelist only deployment platform IPs
- ✅ Use database user with minimal permissions

---

## 📊 Post-Deployment Testing

### Test Checklist

```bash
# Replace with your deployment URL
export API_URL="https://your-api.railway.app"

# 1. Health check
curl $API_URL/health

# 2. Sign up
curl -X POST $API_URL/api/signup \
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

# 3. Sign in
curl -X POST $API_URL/api/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'

# 4. Test protected route (replace TOKEN)
curl -X GET $API_URL/api/user \
  -H "Authorization: Bearer YOUR_TOKEN"

# 5. Test email (check inbox)
curl -X POST $API_URL/api/password/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

### Expected Results

- ✅ Health check returns 200
- ✅ Sign up creates user and sends emails
- ✅ Sign in returns token
- ✅ Protected route returns user data
- ✅ Password reset sends email

---

## 🔧 Update React Native App

After deployment, update your React Native app:

### src/config/api.js

```javascript
const ENV = {
  dev: {
    apiUrl: 'http://localhost:3003',
  },
  staging: {
    apiUrl: 'https://saintshub-api-staging.railway.app', // Your staging URL
  },
  prod: {
    apiUrl: 'https://saintshub-api.railway.app', // Your production URL
  },
};

const getEnvVars = (env = Constants.manifest.releaseChannel) => {
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

## 🐛 Troubleshooting

### Issue: "Cannot connect to MongoDB"

**Solution:**
1. Check MongoDB Atlas network access
2. Add `0.0.0.0/0` to whitelist (allow all IPs)
3. Verify connection string in environment variables

### Issue: "Emails not sending"

**Solution:**
1. Check SMTP credentials in environment variables
2. Verify email password is properly quoted
3. Test SMTP connection manually
4. Check Hostinger SMTP status

### Issue: "CORS errors"

**Solution:**
1. Update `FRONTEND_URL` environment variable
2. Update CORS configuration in `src/index.ts`
3. Ensure credentials: true if using cookies

### Issue: "Cold starts (Vercel/Render free tier)"

**Solution:**
1. Use Railway (no cold starts)
2. Upgrade to paid plan
3. Use cron job to ping server every 10 minutes

### Issue: "File uploads failing"

**Solution:**
1. Ensure using Cloudinary (not local storage)
2. Verify Cloudinary credentials
3. Check file size limits

### Issue: "Rate limit errors"

**Solution:**
1. Check if Redis is configured (for distributed rate limiting)
2. Increase rate limits if needed
3. Implement IP whitelisting for known clients

---

## 📈 Monitoring & Logs

### Railway

```bash
# View logs
railway logs

# Follow logs in real-time
railway logs --follow
```

Dashboard: https://railway.app/dashboard

### Vercel

Dashboard: https://vercel.com/dashboard
- Real-time logs
- Function execution stats
- Performance metrics

### Render

Dashboard: https://dashboard.render.com
- Service logs
- Metrics
- Health checks

---

## 💰 Cost Comparison

| Platform | Free Tier | Paid Plan | Best For |
|----------|-----------|-----------|----------|
| **Railway** | $5 credit/mo | ~$5-10/mo | This project ✅ |
| **Render** | 750 hrs/mo | $7/mo | Budget option |
| **Vercel** | Hobby free | $20/mo Pro | Serverless |
| **Heroku** | Limited | $7/mo | Traditional apps |
| **DigitalOcean** | - | $6/mo | Full control |

---

## 🎯 Recommended Deployment

### For Development/Testing
**Platform:** Render Free Tier
**Why:** No cost, easy setup, good for testing

### For Production
**Platform:** Railway
**Why:** 
- Persistent server (needed for this app)
- No execution limits
- WebSocket support (future features)
- Reliable performance
- Only ~$5/month

### For Serverless API Only
**Platform:** Vercel
**Why:** Fast, free tier, good for lightweight APIs
**Note:** May need code modifications for serverless

---

## 🚀 Quick Start (Railway - Recommended)

```bash
# 1. Create Railway account
https://railway.app

# 2. Create new project from GitHub
Select saintshub-dashboard-server-main

# 3. Add environment variables
Copy from .env file

# 4. Deploy
Automatic on push to main branch

# 5. Get URL
https://saintshub-api-production.up.railway.app

# 6. Test
curl https://saintshub-api-production.up.railway.app/health

# 7. Update React Native app
Update API_URL in config
```

**Done! Your API is live! 🎉**

---

## 📞 Support

**Backend Server:** `C:\Users\nzemb\OneDrive\Documents\Web Development\Projects\saintshub-dashboard-server-main`

**Documentation:** See all `*_DOCUMENTATION.md` files

**Deployment Issues:** Check platform-specific logs and documentation

---

**Last Updated:** October 23, 2025  
**Recommended Platform:** Railway  
**Alternative:** Render (Free Tier)
