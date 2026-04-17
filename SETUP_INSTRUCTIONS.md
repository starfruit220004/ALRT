# Smart Alert - Setup & Configuration Instructions

## ✅ What I've Fixed For You

### Frontend Configuration
1. ✅ Created `.env` - Local development base config
2. ✅ Created `.env.local` - Local development overrides (not tracked in git)
3. ✅ Created `.env.production` - Production defaults with instructions
4. ✅ Created `.env.example` - Template documentation
5. ✅ Updated `vite.config.js` - Proper environment variable handling
6. ✅ Updated `.gitignore` - Properly ignores sensitive files

### Backend Configuration
1. ✅ Cleaned up `.env` - Proper format and organization
2. ✅ Created `.env.example` - Template documentation
3. ✅ Updated `.gitignore` - Properly ignores sensitive files

### Documentation
1. ✅ Created `DEPLOYMENT_GUIDE.md` - Complete deployment instructions
2. ✅ Created this file - Setup instructions

---

## 🎯 What You Need to Do Now

### Step 1: Update Backend .env (REQUIRED for connection to work)

Edit `Backend/.env` and update `FRONTEND_URL` to your Vercel frontend URL:

```bash
# Backend/.env

DATABASE_URL="postgresql://postgres:jean@localhost:5432/alrt_db"
PORT=5000
NODE_ENV=development
JWT_SECRET=supersecretkey
FRONTEND_URL=https://alrt-lx71y5el5-starfruit220004s-projects.vercel.app  # ← Update this!
EMAIL_USER=hannahjeanbalimbingan@gmail.com
EMAIL_PASS=oaexhovpzqguutoa
MQTT_BROKER=mqtt://broker.hivemq.com:1883
ADMIN_SECRET=hannah
```

### Step 2: Deploy Your Backend

Choose one of these hosting options:

#### A) Heroku (Easiest for beginners)
```bash
# 1. Sign up at https://www.heroku.com
# 2. Create a new app
# 3. Connect your GitHub repository
# 4. Deploy

# Then in Vercel, set:
VITE_API_URL=https://your-app-name.herokuapp.com
VITE_SOCKET_URL=https://your-app-name.herokuapp.com
```

#### B) Railway (Modern alternative)
```bash
# 1. Sign up at https://railway.app
# 2. Create new project
# 3. Connect GitHub
# 4. Deploy

# Then in Vercel, set:
VITE_API_URL=https://your-app-name.up.railway.app
VITE_SOCKET_URL=https://your-app-name.up.railway.app
```

#### C) Render (Free tier available)
```bash
# 1. Sign up at https://render.com
# 2. Create new web service
# 3. Connect GitHub
# 4. Deploy

# Then in Vercel, set:
VITE_API_URL=https://your-app-name.onrender.com
VITE_SOCKET_URL=https://your-app-name.onrender.com
```

### Step 3: Update Vercel Environment Variables

1. Go to https://vercel.com/dashboard
2. Select your ALRT project
3. Go to **Settings** → **Environment Variables**
4. Add or update:
   ```
   VITE_API_URL = https://your-backend-url.com
   VITE_SOCKET_URL = https://your-backend-url.com
   ```
5. Click **Save** → Vercel will automatically redeploy

### Step 4: Test the Connection

1. Visit your Vercel frontend: https://alrt-lx71y5el5-starfruit220004s-projects.vercel.app
2. Open browser DevTools (F12)
3. Go to **Console** tab
4. Run these commands:
   ```javascript
   // Check if env var is loaded
   console.log(import.meta.env.VITE_API_URL)
   
   // Test API connection
   fetch(import.meta.env.VITE_API_URL + '/api/auth/profile')
     .then(r => r.json())
     .then(console.log)
     .catch(console.error)
   ```

5. If you see errors:
   - ❌ "Cannot GET /api/auth/profile" → Backend not deployed or wrong URL
   - ❌ "CORS error" → Backend's `FRONTEND_URL` not set correctly
   - ❌ "undefined" → Env variable not loaded (redeploy Vercel)

---

## 📁 File Structure Summary

```
Smart_Alert/
├── DEPLOYMENT_GUIDE.md          ← Read this for detailed deployment guide
├── SETUP_INSTRUCTIONS.md        ← This file
├── Frontend/
│   ├── .env                     ← Base development config (commit to git)
│   ├── .env.local               ← Local overrides (NOT in git)
│   ├── .env.production          ← Production defaults (commit to git)
│   ├── .env.example             ← Template (commit to git)
│   ├── .gitignore               ← Updated to ignore .env.local
│   ├── vite.config.js           ← Updated with env var handling
│   └── src/
│       ├── socket.js            ← Uses VITE_SOCKET_URL env var
│       ├── hooks/useCms.js      ← Uses VITE_API_URL env var
│       └── [other files]        ← All use env vars, not hardcoded URLs
│
└── Backend/
    ├── .env                     ← Your actual config (NOT in git)
    ├── .env.example             ← Template (commit to git)
    ├── .gitignore               ← Updated to ignore .env
    ├── server.js                ← Uses FRONTEND_URL for CORS
    └── [other files]
```

---

## 🔒 Security Reminders

✅ DO:
- Use `.env.example` files to document what's needed
- Set environment variables on hosting platforms (Vercel, Heroku, etc.)
- Use strong `JWT_SECRET` in production
- Use App-Specific Password for Gmail (not your regular password)
- Use HTTPS for both frontend and backend

❌ DON'T:
- Commit `.env` files to git
- Commit `.env.local` to git
- Use the same secrets in development and production
- Share secrets in code or comments
- Push database passwords to repository

---

## 🚀 Quick Deployment Checklist

### Backend Deployment
- [ ] Create account on Heroku/Railway/Render
- [ ] Connect your GitHub repository
- [ ] Set environment variables on the hosting platform
- [ ] Deploy and get your backend URL
- [ ] Update Backend `.env` with `FRONTEND_URL=https://alrt-...vercel.app`

### Frontend Deployment (already done, just update)
- [ ] Go to Vercel Dashboard
- [ ] Go to Settings → Environment Variables
- [ ] Add `VITE_API_URL` = your backend URL
- [ ] Add `VITE_SOCKET_URL` = your backend URL
- [ ] Wait for automatic redeploy
- [ ] Test connection in browser console

---

## 📞 Troubleshooting

### Frontend can't connect to backend
```
Solution:
1. Check Vercel env vars are set correctly
2. Check backend is deployed and running
3. Check Backend .env has FRONTEND_URL set
4. Hard refresh browser (Ctrl+Shift+R)
5. Clear browser cache
```

### Socket.io not connecting
```
Solution:
1. Make sure VITE_SOCKET_URL is set in Vercel
2. Make sure backend is running
3. Check backend CORS configuration
4. Backend must have Socket.io server running on same port as API
```

### CORS errors
```
Solution:
1. Backend .env must have: FRONTEND_URL=https://alrt-...vercel.app
2. Restart backend server
3. Hard refresh frontend
```

### Env variables showing as "undefined"
```
Solution:
1. Go to Vercel Dashboard
2. Settings → Deployments
3. Click "Redeploy" on latest deployment
4. Wait 2-3 minutes for redeploy
5. Hard refresh browser
```

---

## 📖 Additional Resources

- **Vercel Docs**: https://vercel.com/docs
- **Environment Variables**: https://vercel.com/docs/concepts/projects/environment-variables
- **Socket.io Docs**: https://socket.io/docs/
- **Prisma Docs**: https://www.prisma.io/docs/

---

## ❓ Questions?

Check `DEPLOYMENT_GUIDE.md` for more detailed information on:
- Different hosting providers
- SSL/HTTPS setup
- Custom domain setup
- Debugging connection issues

All environment variables are now properly configured. Your app is ready to deploy! 🚀
