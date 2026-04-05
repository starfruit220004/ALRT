// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

// W1 fix: protected — was publicly exposing name/email/role/phone of all users
router.get("/users", verifyToken, isAdmin, userController.getUsers);

module.exports = router;