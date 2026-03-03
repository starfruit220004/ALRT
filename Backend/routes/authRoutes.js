const express = require('express');
const router = express.Router();
const auth = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

// Public routes
router.post('/signup',          auth.signup);
router.post('/login',           auth.login);
router.post('/google',          auth.googleAuth);
router.post('/forgot-password', auth.forgotPassword);
router.post('/reset-password',  auth.resetPassword);

// Protected routes (require valid JWT)
router.put('/profile', verifyToken, auth.updateProfile);

module.exports = router;