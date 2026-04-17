# Smart Alert - Deployment & Connection Guide

## Overview
This guide explains how to connect your Vercel-hosted frontend to your backend.

---

## 📋 Environment Variables Files

### Frontend Files
- `.env` - Base configuration (checked into git)
- `.env.local` - Local development overrides (NOT in git)
- `.env.production` - Production defaults (checked into git)
- `.env.example` - Template documentation

### Backend Files
- `.env` - Your actual configuration (NOT in git)
- `.env.example` - Template documentation (checked into git)

---

## 🚀 Frontend Deployment on Vercel

### Step 1: Current Setup
Your frontend is already deployed at:
```
https://alrt-lx71y5el5-starfruit220004s-projects.vercel.app
```

### Step 2: Set Backend URL in Vercel
1. Go to https://vercel.com/dashboard
2. Select your ALRT project
3. Go to **Settings** → **Environment Variables**
4. Add/Update these variables:
   ```
   VITE_API_URL=https://your-backend-url.com
   VITE_SOCKET_URL=https://your-backend-url.com
   ```
5. Click **Save** and Vercel will automatically redeploy

---

## 🔧 Backend Configuration

### Step 1: Update .env File
Edit your `Backend/.env`:
```bash
# Your actual backend URL when deployed
FRONTEND_URL=https://alrt-lx71y5el5-starfruit220004s-projects.vercel.app
```

### Step 2: Backend Hosting Options

#### Option A: Heroku
```bash
# In Backend/.env
FRONTEND_URL=https://alrt-lx71y5el5-starfruit220004s-projects.vercel.app

# In Vercel Environment Variables:
VITE_API_URL=https://your-app-name.herokuapp.com
VITE_SOCKET_URL=https://your-app-name.herokuapp.com
```

#### Option B: Railway
```bash
# In Backend/.env
FRONTEND_URL=https://alrt-lx71y5el5-starfruit220004s-projects.vercel.app

# In Vercel Environment Variables:
VITE_API_URL=https://your-app-name.up.railway.app
VITE_SOCKET_URL=https://your-app-name.up.railway.app
```

#### Option C: Render
```bash
# In Backend/.env
FRONTEND_URL=https://alrt-lx71y5el5-starfruit220004s-projects.vercel.app

# In Vercel Environment Variables:
VITE_API_URL=https://your-app-name.onrender.com
VITE_SOCKET_URL=https://your-app-name.onrender.com
```

#### Option D: Custom Server (AWS, DigitalOcean, etc.)
```bash
# In Backend/.env
FRONTEND_URL=https://alrt-lx71y5el5-starfruit220004s-projects.vercel.app

# In Vercel Environment Variables:
VITE_API_URL=https://api.yourdomain.com
VITE_SOCKET_URL=https://api.yourdomain.com
```

---

## ✅ Verification Checklist

### Frontend
- [ ] `.env.local` exists with localhost URLs for local development
- [ ] Vercel Environment Variables are set with your backend URL
- [ ] Frontend is redeployed after setting env vars
- [ ] Check browser DevTools → Application → check if `VITE_API_URL` is set correctly

### Backend
- [ ] `.env` file exists with valid DATABASE_URL
- [ ] `FRONTEND_URL` matches your Vercel frontend URL
- [ ] Backend is deployed and running
- [ ] CORS is properly configured (backend server.js handles it)

### Connection Test
In browser console, run:
```javascript
// Should show your backend URL (not localhost)
console.log(import.meta.env.VITE_API_URL)

// Should connect without CORS errors
fetch(import.meta.env.VITE_API_URL + '/api/auth/profile')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

---

## 🐛 Common Issues & Solutions

### ❌ "Cannot GET /api/auth/profile"
- Backend is not running or wrong URL
- **Fix**: Make sure backend is deployed and `VITE_API_URL` is correct

### ❌ "WebSocket connection failed"
- Socket URL is wrong or pointing to localhost
- **Fix**: Make sure `VITE_SOCKET_URL` matches your backend URL in Vercel

### ❌ "CORS error: Origin not allowed"
- Vercel URL not in backend CORS whitelist
- **Fix**: Update Backend `.env`: `FRONTEND_URL=https://alrt-lx71y5el5-starfruit220004s-projects.vercel.app`

### ❌ "Mixed Content" error (HTTPS frontend → HTTP backend)
- Frontend is HTTPS but backend is HTTP
- **Fix**: Use HTTPS for both (get SSL certificate on backend server)

### ❌ Variables showing "undefined" in browser
- Env variables not redeployed
- **Fix**: 
  1. Go to Vercel Dashboard
  2. Trigger a redeploy (Settings → Deployments → Redeploy)
  3. Clear browser cache

---

## 📝 Environment Variables Quick Reference

### Local Development
```bash
# Frontend/.env.local
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000

# Backend/.env
FRONTEND_URL=http://localhost:5173
```

### Production (Vercel + Your Backend)
```bash
# Vercel Dashboard → Settings → Environment Variables
VITE_API_URL=https://your-backend-url.com
VITE_SOCKET_URL=https://your-backend-url.com

# Backend/.env
FRONTEND_URL=https://alrt-lx71y5el5-starfruit220004s-projects.vercel.app
```

---

## 🔐 Security Notes

1. **Never commit `.env` files** - they contain secrets
2. **Use environment variables** on hosting platforms instead
3. **Change `JWT_SECRET`** in production to a strong random string
4. **Use HTTPS** for both frontend and backend
5. **Use App-Specific Passwords** for Gmail (not regular passwords)

---

## 📞 Need Help?

If something isn't connecting:
1. Check browser console for CORS errors
2. Check backend logs for connection issues
3. Verify env variables are set correctly
4. Make sure backend is running/deployed
5. Clear browser cache and hard refresh (Ctrl+Shift+R)
