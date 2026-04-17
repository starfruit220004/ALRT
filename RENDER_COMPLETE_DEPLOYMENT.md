# 🚀 Complete Render Deployment: Database + Backend

## Overview
Render provides both PostgreSQL database hosting and web service hosting, so you can host your entire backend stack on Render.

---

## 📋 What You'll Create on Render

1. **PostgreSQL Database** - Your data storage
2. **Web Service** - Your Node.js backend API
3. **Environment Variables** - Configuration for both services

---

## 🎯 Step-by-Step Deployment

### **Phase 1: Create PostgreSQL Database**

1. Go to https://render.com → Click **"New"** → **"PostgreSQL"**

2. Configure Database:
   ```
   Name: smart-alert-db
   Database: alrt_db
   User: postgres
   Region: Choose closest to you (e.g., Singapore, Oregon, Frankfurt)
   Plan: Free (to start)
   ```

3. Click **"Create Database"**

4. **Wait 2-3 minutes** for database provisioning

5. **Copy the connection string** from the "Connections" tab:
   ```
   postgresql://postgres:password@host:port/alrt_db
   ```
   This is your `DATABASE_URL`

---

### **Phase 2: Create Web Service (Backend)**

1. In Render dashboard → Click **"New"** → **"Web Service"**

2. Connect Repository:
   - Click **"Connect"** next to your `ALRT` repository
   - Render will detect your `render.yaml` configuration

3. Configure Service:
   ```
   Name: smart-alert-backend
   Runtime: Node
   Build Command: npm install && npx prisma generate
   Start Command: npm start
   Plan: Free (to start)
   ```

4. Click **"Create Web Service"**

---

### **Phase 3: Configure Environment Variables**

In your **Web Service** dashboard → **"Environment"** tab → Add these variables:

#### Required Variables:
```
NODE_ENV=production
DATABASE_URL=postgresql://postgres:password@host:port/alrt_db  # From database
JWT_SECRET=your-super-secret-jwt-key-make-this-very-long-and-random-123456789
FRONTEND_URL=https://alrt-lx71y5el5-starfruit220004s-projects.vercel.app
MQTT_BROKER=mqtt://broker.hivemq.com:1883
```

#### Optional Variables (for email):
```
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password-from-gmail
ADMIN_SECRET=change-this-to-a-different-secret
```

---

### **Phase 4: Deploy**

1. Click **"Create Web Service"** (if not already done)
2. **Wait 5-10 minutes** for deployment
3. Monitor the **"Logs"** tab for any errors
4. Once deployed, copy your service URL:
   ```
   https://smart-alert-backend.onrender.com
   ```

---

### **Phase 5: Update Vercel Frontend**

1. Go to https://vercel.com/dashboard
2. Select your **ALRT** project
3. **Settings** → **Environment Variables**
4. Update:
   ```
   VITE_API_URL = https://smart-alert-backend.onrender.com
   VITE_SOCKET_URL = https://smart-alert-backend.onrender.com
   ```
5. Vercel will auto-redeploy (2-3 minutes)

---

## ✅ Verification Checklist

### Database Check:
- [ ] Render PostgreSQL service is **"Available"**
- [ ] Connection string copied correctly
- [ ] Database name is `alrt_db`

### Backend Check:
- [ ] Web service shows **"Live"** status
- [ ] Logs show: `[Server] Running on port 10000`
- [ ] Logs show: `prisma:query` (database connected)
- [ ] Logs show: `[MQTT] Connected to broker`

### Frontend Check:
- [ ] Vercel deployment successful
- [ ] Browser console shows no CORS errors
- [ ] API calls return data (not errors)

---

## 🧪 Testing Your Deployment

### Test 1: Direct API Test
```bash
# Replace with your Render URL
curl https://smart-alert-backend.onrender.com/api/cms?section=home
# Should return JSON data
```

### Test 2: Frontend Test
1. Visit: https://alrt-lx71y5el5-starfruit220004s-projects.vercel.app
2. Open DevTools (F12) → Console
3. Should see successful API calls
4. Try logging in/registering

### Test 3: Database Test
- Check Render database **"Metrics"** tab
- Should show active connections during API calls

---

## 💰 Render Pricing Overview

### Free Tier (Perfect for testing):
- **Web Service**: 750 hours/month, sleeps after 15min inactivity
- **PostgreSQL**: 256MB storage, 512MB RAM
- **Bandwidth**: 100GB/month

### Paid Plans (for production):
- **Web Service**: $7/month (always-on, more resources)
- **PostgreSQL**: $7/month (1GB storage, more RAM)

---

## 🔄 Updating Your Deployment

### Code Changes:
1. Push to GitHub → Render auto-deploys (2-3 minutes)

### Environment Variables:
1. Render Service → **"Environment"** → Update variables
2. Click **"Manual Deploy"** → **"Clear build cache and deploy"**

---

## 🐛 Common Issues & Solutions

### ❌ "Build failed: prisma generate"
```
Solution:
1. Check DATABASE_URL is correct
2. Make sure database is running
3. Check Render logs for specific error
```

### ❌ "Can't connect to database"
```
Solution:
1. Verify DATABASE_URL format
2. Check database is "Available" in Render
3. Make sure database name is 'alrt_db'
```

### ❌ "CORS error on frontend"
```
Solution:
1. Check FRONTEND_URL matches Vercel URL exactly
2. Make sure it's https:// not http://
3. Restart web service after env var changes
```

### ❌ "Service sleeping" (Free tier)
```
Solution:
1. First request takes 30-60 seconds to wake up
2. Upgrade to paid plan for always-on ($7/month)
3. Or accept the wake-up delay for free tier
```

---

## 📊 Monitoring Your Services

### Web Service:
- **Logs**: Real-time application logs
- **Metrics**: CPU, RAM, response times
- **Events**: Deployment history

### Database:
- **Metrics**: Connections, storage usage
- **Logs**: Database operations

---

## 🚀 Production Readiness

### Before Going Live:
- [ ] Test all API endpoints
- [ ] Test user registration/login
- [ ] Test real-time features (Socket.io)
- [ ] Test email functionality
- [ ] Monitor error logs
- [ ] Set up alerts in Render dashboard

### Security Checklist:
- [ ] Strong JWT_SECRET (long random string)
- [ ] Secure EMAIL_PASS (App-Specific Password)
- [ ] FRONTEND_URL correctly set
- [ ] No sensitive data in logs

---

## 📞 Support & Troubleshooting

1. **Check Render Logs** - Most issues show up in service logs
2. **Test API Directly** - Use curl to isolate backend issues
3. **Check Environment Variables** - Typos are common
4. **Verify Database Connection** - Test with a simple query

---

## 🎉 Success Indicators

When everything works:
- ✅ Frontend loads without CORS errors
- ✅ User registration/login works
- ✅ Dashboard shows real-time data
- ✅ Admin panel functions properly
- ✅ Email notifications work (if configured)
- ✅ IoT device communication works

Your complete stack will be hosted on Render! 🚀

---

## 📝 Quick Reference

**Frontend (Vercel):** https://alrt-lx71y5el5-starfruit220004s-projects.vercel.app
**Backend (Render):** https://smart-alert-backend.onrender.com
**Database (Render):** PostgreSQL service in your Render dashboard

**Environment Variables:**
- Frontend: `VITE_API_URL` and `VITE_SOCKET_URL` point to Render backend
- Backend: `DATABASE_URL` points to Render PostgreSQL
- Backend: `FRONTEND_URL` allows Vercel frontend