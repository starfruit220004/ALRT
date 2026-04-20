/*
  ═══════════════════════════════════════════════════════
  config/authMiddleware.js
  ───────────────────────────────────────────────────────
  FIXES:
  1. CRITICAL SECURITY FIX: App now crashes on startup if
     JWT_SECRET env var is missing, instead of silently
     falling back to the literal string "secret".
     Anyone who reads your source code could forge admin
     tokens with that fallback. Never use a hardcoded default.
  ═══════════════════════════════════════════════════════
*/

const jwt = require('jsonwebtoken');

// ✅ FIX: Crash immediately if JWT_SECRET is not set.
//    A missing secret is a critical misconfiguration —
//    failing loudly at startup is far safer than silently
//    signing tokens with the string "secret".
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('[FATAL] JWT_SECRET environment variable is not set. Refusing to start.');
  process.exit(1);
}

// ─────────────────────────────────────────
// Verify JWT Token
// ─────────────────────────────────────────
exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(403).json({ message: 'No token provided' });

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// ─────────────────────────────────────────
// Admin Only Guard
// ─────────────────────────────────────────
exports.isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin')
    return res.status(403).json({ message: 'Access denied: Admins only' });
  next();
};