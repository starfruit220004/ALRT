// const jwt = require('jsonwebtoken');
// const SECRET = process.env.JWT_SECRET || "secret";

// exports.verifyToken = (req, res, next) => {
//   const authHeader = req.headers['authorization'];

//   if (!authHeader || !authHeader.startsWith('Bearer '))
//     return res.status(403).json({ message: 'No token provided' });

//   const token = authHeader.split(' ')[1];

//   try {
//     const decoded = jwt.verify(token, SECRET);
//     req.user = decoded;
//     next();
//   } catch {
//     res.status(401).json({ message: 'Invalid token' });
//   }
// };

// exports.isAdmin = (req, res, next) => {
//   if (req.user.role !== 'admin')
//     return res.status(403).json({ message: "Admin only" });
//   next();
// };

const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
  // Get token from the header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extract the token from "Bearer <token>"

  // If there is no token, deny access
  if (!token) {
    return res.status(401).json({ message: "Access Denied: No Token Provided" });
  }

  try {
    // Verify token using your secret key from .env
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified; // Add user data to the request object
    next(); // Move to the next function (the controller)
  } catch (err) {
    res.status(403).json({ message: "Invalid Token" });
  }
};