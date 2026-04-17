# 🚀 Deploy Backend to Render

## Step-by-Step Render Deployment Guide

---

## 📋 Prerequisites

1. **GitHub Account** - Your code is already on GitHub
2. **Render Account** - Sign up at https://render.com
3. **PostgreSQL Database** - We'll create this on Render

---

## 🎯 Step 1: Create Render PostgreSQL Database

1. Go to https://render.com
2. Click **"New"** → **"PostgreSQL"**
3. Configure:
   - **Name**: `smart-alert-db` (or your choice)
   - **Database**: `alrt_db` (or your choice)
   - **User**: `postgres` (or your choice)
   - **Region**: Choose closest to you
   - **Plan**: Free tier is fine to start
4. Click **"Create Database"**
5. **Wait 2-3 minutes** for database to be ready
6. **Copy the connection string** from the dashboard (looks like: `postgresql://user:pass@host:port/db`)

---

## 🎯 Step 2: Create Render Web Service

1. In Render dashboard, click **"New"** → **"Web Service"**
2. Connect your GitHub repository:
   - Click **"Connect"** next to your `ALRT` repository
   - Render will detect your `render.yaml` file
3. Configure the service:
   - **Name**: `smart-alert-backend` (or your choice)
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npx prisma generate`
   - **Start Command**: `npm start`
   - **Plan**: Free tier is fine to start

---

## 🎯 Step 3: Set Environment Variables

In your Render web service dashboard, go to **"Environment"** and add these variables:

### Required Variables:
```
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:port/db  # From Step 1
JWT_SECRET=your-super-secret-jwt-key-change-this-to-a-long-random-string
FRONTEND_URL=https://alrt-lx71y5el5-starfruit220004s-projects.vercel.app
MQTT_BROKER=mqtt://broker.hivemq.com:1883
```

### Optional Variables (for email functionality):
```
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
ADMIN_SECRET=change-this-secret-in-production
```

---

## 🎯 Step 4: Deploy

1. Click **"Create Web Service"**
2. **Wait 5-10 minutes** for deployment
3. Once deployed, copy your **service URL** (looks like: `https://smart-alert-backend.onrender.com`)

---

## 🎯 Step 5: Update Vercel Frontend

1. Go to https://vercel.com/dashboard
2. Select your **ALRT** project
3. Go to **Settings** → **Environment Variables**
4. Update:
   ```
   VITE_API_URL = https://your-render-service.onrender.com
   VITE_SOCKET_URL = https://your-render-service.onrender.com
   ```
5. Vercel will automatically redeploy

---

## ✅ Verification Steps

### Test 1: Check Render Logs
- Go to your Render service dashboard
- Click **"Logs"** tab
- Should see: `[Server] Running on port 10000` and database connections

### Test 2: Test API Connection
```bash
# Replace with your Render URL
curl https://your-render-service.onrender.com/api/cms?section=home
```

### Test 3: Test Frontend Connection
- Visit your Vercel frontend
- Open browser DevTools (F12) → Console
- Should see successful API calls, no CORS errors

---

## 🐛 Common Issues & Solutions

### ❌ "Build failed"
**Solution:**
- Check Render logs for specific error
- Make sure all dependencies are in `package.json`
- Verify `npx prisma generate` runs successfully

### ❌ "Database connection failed"
**Solution:**
- Check `DATABASE_URL` is correct
- Make sure PostgreSQL database is running
- Verify database credentials

### ❌ "Prisma generate failed"
**Solution:**
- Make sure `prisma/schema.prisma` exists
- Check database connection during build
- Verify `DATABASE_URL` is set in build environment

### ❌ "CORS error"
**Solution:**
- Check `FRONTEND_URL` matches your Vercel URL exactly
- Make sure it's `https://` not `http://`
- Restart the service after changing env vars

### ❌ "Port already in use"
**Solution:**
- Render automatically assigns port via `$PORT` env var
- Don't hardcode port in your code (server.js uses `process.env.PORT || 5000`)

---

## 💰 Render Pricing

- **Free Tier**: 750 hours/month, sleeps after 15 minutes of inactivity
- **Paid Plans**: Start at $7/month for always-on services
- **PostgreSQL**: Free tier available (but limited storage)

---

## 🔄 Updating Your Deployment

### Code Changes:
1. Push changes to GitHub
2. Render automatically redeploys (takes 2-3 minutes)

### Environment Variables:
1. Go to Render service → Environment
2. Update variables
3. Click **"Manual Deploy"** → **"Clear build cache and deploy"**

---

## 📊 Monitoring

### View Logs:
- Render Dashboard → Your service → **"Logs"** tab

### View Metrics:
- Render Dashboard → Your service → **"Metrics"** tab

### Database:
- Render Dashboard → Your database → **"Metrics"** tab

---

## 🚀 Going Live

Once everything works:

1. **Test thoroughly** on your Vercel frontend
2. **Monitor logs** for any errors
3. **Consider upgrading** from free tier if you need 24/7 uptime
4. **Set up monitoring** alerts in Render dashboard

---

## 📞 Need Help?

1. Check Render logs for specific error messages
2. Verify all environment variables are set correctly
3. Test API endpoints directly with curl/Postman
4. Check browser console for frontend errors

Your backend will be live at: `https://your-service-name.onrender.com` 🚀