# Quick Reference Card

## 🔗 Frontend ↔️ Backend Connection

### Local Development (on your machine)
```
Frontend: http://localhost:5173
Backend:  http://localhost:5000

Frontend/.env.local:
  VITE_API_URL=http://localhost:5000
  VITE_SOCKET_URL=http://localhost:5000

Backend/.env:
  FRONTEND_URL=http://localhost:5173
```

### Production (Vercel + Hosted Backend)
```
Frontend: https://alrt-lx71y5el5-starfruit220004s-projects.vercel.app
Backend:  https://your-backend-url.com (Heroku/Railway/Render)

Vercel Environment Variables:
  VITE_API_URL=https://your-backend-url.com
  VITE_SOCKET_URL=https://your-backend-url.com

Backend/.env:
  FRONTEND_URL=https://alrt-lx71y5el5-starfruit220004s-projects.vercel.app
```

---

## 📋 Environment Variable Files

| File | Purpose | Git Track? | Where |
|------|---------|-----------|-------|
| `.env` | Base development config | ✅ YES | Frontend, Backend |
| `.env.local` | Local development overrides | ❌ NO | Frontend only |
| `.env.production` | Production defaults | ✅ YES | Frontend |
| `.env.example` | Documentation/template | ✅ YES | Both |

---

## 🎯 What Variables Do What?

### Frontend
```
VITE_API_URL      → Where to send API requests (login, settings, etc.)
VITE_SOCKET_URL   → Where Socket.io connects for real-time updates
VITE_ENV          → development/production flag
```

### Backend
```
DATABASE_URL      → PostgreSQL connection string
JWT_SECRET        → Secret key for signing authentication tokens
FRONTEND_URL      → Your Vercel frontend URL (for CORS)
MQTT_BROKER       → MQTT server for IoT device communication
EMAIL_USER/PASS   → For sending password reset emails
PORT              → Server port (default 5000)
NODE_ENV          → development/production flag
ADMIN_SECRET      → Admin authentication key
```

---

## ✅ Connection Test

Run in browser DevTools console:
```javascript
// 1. Check env var loaded
console.log(import.meta.env.VITE_API_URL)

// 2. Test API
fetch(import.meta.env.VITE_API_URL + '/api/cms?section=home')
  .then(r => r.json())
  .then(data => console.log('✅ API Connected:', data))
  .catch(e => console.error('❌ Connection Error:', e))
```

---

## 🚀 Hosting Providers & URLs

| Provider | Signup | Example URL |
|----------|--------|-------------|
| **Heroku** | https://heroku.com | https://app-name.herokuapp.com |
| **Railway** | https://railway.app | https://app-name.up.railway.app |
| **Render** | https://render.com | https://app-name.onrender.com |
| **AWS** | https://aws.amazon.com | https://ec2-...-amazonaws.com |
| **DigitalOcean** | https://digitalocean.com | https://your-ip-or-domain.com |

---

## 🔐 Never Commit These

```
❌ DON'T commit:
  - Backend/.env
  - Frontend/.env.local
  - Any file with passwords/secrets

✅ DO commit:
  - Backend/.env.example
  - Frontend/.env (without secrets)
  - Frontend/.env.production
  - Frontend/.env.example
```

---

## 🛠️ Common Tasks

### Change Backend URL
```bash
1. Vercel Dashboard → ALRT project
2. Settings → Environment Variables
3. Update VITE_API_URL & VITE_SOCKET_URL
4. Wait for auto-redeploy (2-3 min)
5. Hard refresh: Ctrl+Shift+R
```

### Add New Environment Variable
```bash
1. Add to .env files locally
2. Test locally: npm run dev
3. Go to Vercel Dashboard
4. Settings → Environment Variables → Add new
5. Redeploy
```

### Test Backend Connection
```javascript
// In browser console:
fetch(import.meta.env.VITE_API_URL + '/api/auth/profile', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
})
  .then(r => r.json())
  .then(console.log)
  .catch(e => console.error('❌', e.message))
```

---

## 🐛 Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| Cannot GET /api/... | Backend not running | Deploy backend and set correct URL |
| CORS error | Frontend URL not in backend CORS | Update `FRONTEND_URL` in Backend/.env |
| Socket connection failed | Wrong Socket URL | Update `VITE_SOCKET_URL` in Vercel |
| Undefined variables | Env vars not loaded | Redeploy from Vercel dashboard |
| Mixed Content | HTTPS frontend → HTTP backend | Use HTTPS for both |

---

## 📞 Getting Help

1. Check `DEPLOYMENT_GUIDE.md` for detailed instructions
2. Check `SETUP_INSTRUCTIONS.md` for step-by-step setup
3. Check this file for quick reference
4. Check `.env.example` files for what variables are needed

---

## 🎉 You're All Set!

Your code is now properly configured for:
- ✅ Local development (localhost)
- ✅ Production deployment (Vercel)
- ✅ Backend hosting (any provider)
- ✅ Easy environment switching
- ✅ Secure secret management

Just set your backend URL in Vercel and you're done! 🚀
