const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('[FATAL] JWT_SECRET environment variable is not set. Refusing to start.');
  process.exit(1);
}

// ─────────────────────────────────────────
// Verify JWT Token
// ─────────────────────────────────────────
exports.verifyToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(403).json({ message: 'No token provided' });

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if user is still active in the database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { isActive: true, role: true }
    });

    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Your account has been deactivated' });
    }

    req.user = { ...decoded, role: user.role }; // Ensure role is up to date from DB
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(401).json({ message: 'Invalid token' });
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