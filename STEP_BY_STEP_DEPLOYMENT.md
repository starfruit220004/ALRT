# 🚀 Step-by-Step Deployment Guide

## Part 1: Deploy Backend on Render

### Step 1: Go to Render Dashboard
1. Open https://render.com/dashboard
2. Login with your account

### Step 2: Create Web Service
1. Click **"New"** button (top right)
2. Click **"Web Service"**

### Step 3: Connect GitHub Repository
1. Click **"Connect"** next to your `ALRT` repository
2. If not in list, click **"Configure account"** and authorize GitHub
3. Select `starfruit220004/ALRT`
4. Click **"Connect"**

### Step 4: Configure Service
1. **Name**: `smart-alert-backend` (or any name)
2. **Environment**: `Node`
3. **Build Command**: 
   ```
   npm install && npx prisma generate
   ```
4. **Start Command**: 
   ```
   npm start
   ```
5. **Root Directory** (if asked): `Backend`
6. **Plan**: Select **Free** (for now)

### Step 5: Click Create Web Service
1. Click **"Create Web Service"** button
2. **Wait 5-10 minutes** for deployment

### Step 6: Check Deployment Status
1. In dashboard, look at your service
2. Should see **"Live"** status when done
3. Click on the service name to view **Logs**
4. Look for:
   - ✅ `[Server] Running on port...`
   - ✅ `[MQTT] Connected to broker`
   - ✅ `prisma:query` (database working)

### Step 7: Copy Your Backend URL
1. At the top of your service, copy the URL (e.g., `https://smart-alert-backend.onrender.com`)
2. **Keep this URL** - you need it for Vercel

---

## Part 2: Update Vercel Frontend

### Step 1: Go to Vercel Dashboard
1. Open https://vercel.com/dashboard
2. Login with your account

### Step 2: Select Your Project
1. Click on **ALRT** project

### Step 3: Go to Settings
1. Click **"Settings"** tab
2. In left menu, click **"Environment Variables"**

### Step 4: Update API URL
1. Find `VITE_API_URL` (if it exists)
   - If exists: Click **"Edit"** (pencil icon)
   - If not: Click **"Add New"**
2. **Key**: `VITE_API_URL`
3. **Value**: Paste your Render URL
   ```
   https://smart-alert-backend.onrender.com
   ```
4. Click **"Save"**

### Step 5: Update Socket URL
1. Find `VITE_SOCKET_URL` (if it exists)
   - If exists: Click **"Edit"** (pencil icon)
   - If not: Click **"Add New"**
2. **Key**: `VITE_SOCKET_URL`
3. **Value**: Paste your Render URL
   ```
   https://smart-alert-backend.onrender.com
   ```
4. Click **"Save"**

### Step 6: Trigger Redeploy
1. Click **"Deployments"** tab
2. Find the latest deployment
3. Click the **"..."** menu
4. Click **"Redeploy"**
5. Click **"Redeploy"** button again
6. **Wait 2-3 minutes** for redeploy

---

## Part 3: Test Everything

### Test 1: Check Frontend
1. Open your Vercel URL:
   ```
   https://alrt-lx71y5el5-starfruit220004s-projects.vercel.app
   ```
2. Should load without errors
3. Open browser **DevTools** (F12)
4. Go to **Console** tab
5. Should see **no red errors**

### Test 2: Test Login
1. Try to sign up or login
2. If it works, backend is connected ✅

### Test 3: Check Render Logs
1. Go back to Render dashboard
2. Click your backend service
3. Click **"Logs"** tab
4. You should see API requests coming in from your frontend
5. No errors = Success ✅

---

## 🎉 You're Done!

If everything works:
- ✅ Frontend on Vercel
- ✅ Backend on Render
- ✅ Database on Render
- ✅ All connected together

Your app is now fully hosted! 🚀

---

## ⚠️ If Something Goes Wrong

### Backend won't deploy
- Check Render **Logs** for error messages
- Make sure all environment variables are set
- Check that `DATABASE_URL` is correct

### Frontend shows errors
- Hard refresh: **Ctrl+Shift+R**
- Clear browser cache
- Check DevTools Console for specific error
- Make sure `VITE_API_URL` and `VITE_SOCKET_URL` are correct

### Can't connect to database
- Check Render PostgreSQL service is **"Available"**
- Verify `DATABASE_URL` in environment variables
- Make sure database name is `alrt_db`

---

## 📞 Quick Checklist

- [ ] Render backend deployed (check for "Live" status)
- [ ] Render backend URL copied
- [ ] Vercel `VITE_API_URL` updated
- [ ] Vercel `VITE_SOCKET_URL` updated
- [ ] Vercel redeployed
- [ ] Frontend loads without CORS errors
- [ ] Can login/register on frontend
- [ ] Render logs show incoming requests

If all checked ✅, you're done!