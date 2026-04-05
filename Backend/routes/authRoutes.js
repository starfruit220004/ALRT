// routes/authRoutes.js
const express = require("express");
const router  = express.Router();
const auth    = require("../controllers/authController");
const { verifyToken } = require("../middleware/authMiddleware");

// Public routes
router.post("/signup",           auth.signup);
router.post("/login",            auth.login);
router.post("/google",           auth.googleAuth);
router.post("/forgot-password",  auth.forgotPassword);
router.post("/reset-password",   auth.resetPassword);
router.get("/phone/:userId",     auth.getPhoneNumber);

// Email verification routes
router.get("/verify-email",      auth.verifyEmail);         // ?token=xxx
router.post("/resend-verify",    auth.resendVerification);

// One-time admin creation (requires X-Admin-Secret header)
router.post("/create-admin",     auth.createAdmin);

// Protected routes
router.put("/profile", verifyToken, auth.updateProfile);

module.exports = router;
