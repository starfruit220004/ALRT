// routes/adminRoutes.js
const express = require("express");
const router  = express.Router();
const prisma  = require("../config/prisma");
const bcrypt  = require("bcrypt");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

// ─────────────────────────────────────────
// GET all users
// ─────────────────────────────────────────
router.get("/users", verifyToken, isAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id:           true,
        name:         true,
        email:        true,
        role:         true,
        mqttTopic:    true,
        isActive:     true,
        deactivatedAt: true,
      },
      orderBy: { id: "asc" },
    });
    res.json(users);
  } catch (err) {
    console.error("Get users error:", err);
    res.status(500).json({ message: "Error fetching users" });
  }
});

// ─────────────────────────────────────────
// CREATE user (admin only, role always "user")
// ─────────────────────────────────────────
router.post("/users", verifyToken, isAdmin, async (req, res) => {
  const {
    firstName, lastName, middleName,
    username, email, password,
    phone, address,
  } = req.body;

  if (!firstName?.trim()) return res.status(400).json({ message: "First name is required" });
  if (!lastName?.trim())  return res.status(400).json({ message: "Last name is required" });
  if (!username?.trim())  return res.status(400).json({ message: "Username is required" });
  if (!email?.trim())     return res.status(400).json({ message: "Email is required" });
  if (!password?.trim())  return res.status(400).json({ message: "Password is required" });
  if (!phone?.trim())     return res.status(400).json({ message: "Phone number is required" });
  if (!address?.trim())   return res.status(400).json({ message: "Address is required" });

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const hashed   = await bcrypt.hash(password, 10);
    const fullName = `${firstName} ${lastName}`.trim();

    const newUser = await prisma.user.create({
      data: {
        name:       fullName,
        email,
        password:   hashed,
        role:       "user",
        phone:      phone      || null,
        username:   username   || null,
        firstName:  firstName,
        lastName:   lastName,
        middleName: middleName || null,
        address:    address    || null,
        mqttTopic:  "placeholder",
      },
    });

    const mqttTopic = `Smart_Alert/user_${newUser.id}/door`;
    const updated = await prisma.user.update({
      where: { id: newUser.id },
      data:  { mqttTopic },
    });

    await prisma.settings.create({
      data: {
        alarmEnabled:  false,
        smsEnabled:    false,
        scheduleStart: "08:00",
        scheduleEnd:   "17:00",
        userId:        newUser.id,
      },
    });

    res.status(201).json({
      id:        updated.id,
      name:      updated.name,
      email:     updated.email,
      role:      updated.role,
      mqttTopic: updated.mqttTopic,
    });
  } catch (err) {
    console.error("Create user error:", err);
    res.status(500).json({ message: "Error creating user" });
  }
});

// ─────────────────────────────────────────
// UPDATE user (name + email only, no role)
// ─────────────────────────────────────────
router.put("/users/:id", verifyToken, isAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { name, email } = req.body;

  try {
    // Guard: cannot edit admin accounts
    const target = await prisma.user.findUnique({
      where:  { id },
      select: { role: true },
    });

    if (!target) {
      return res.status(404).json({ message: "User not found" });
    }
    if (target.role === "admin") {
      return res.status(403).json({ message: "Cannot edit admin account" });
    }

    const updated = await prisma.user.update({
      where: { id },
      data:  { name, email },
      select: {
        id:           true,
        name:         true,
        email:        true,
        role:         true,
        mqttTopic:    true,
        isActive:     true,
        deactivatedAt: true,
      },
    });

    res.json(updated);
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ message: "Error updating user" });
  }
});

// ─────────────────────────────────────────
// DEACTIVATE user
// ─────────────────────────────────────────
router.patch("/users/:id/deactivate", verifyToken, isAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const target = await prisma.user.findUnique({
      where:  { id },
      select: { role: true },
    });

    if (!target) {
      return res.status(404).json({ message: "User not found" });
    }
    if (target.role === "admin") {
      return res.status(403).json({ message: "Cannot deactivate admin account" });
    }

    await prisma.user.update({
      where: { id },
      data:  { isActive: false, deactivatedAt: new Date() },
    });

    res.json({ message: "Account deactivated." });
  } catch (err) {
    console.error("Deactivate user error:", err);
    res.status(500).json({ message: "Error deactivating user" });
  }
});

// ─────────────────────────────────────────
// ACTIVATE user
// ─────────────────────────────────────────
router.patch("/users/:id/activate", verifyToken, isAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
      return res.status(404).json({ message: "User not found" });
    }

    await prisma.user.update({
      where: { id },
      data:  { isActive: true, deactivatedAt: null },
    });

    res.json({ message: "Account activated." });
  } catch (err) {
    console.error("Activate user error:", err);
    res.status(500).json({ message: "Error activating user" });
  }
});

// ─────────────────────────────────────────
// GET all alerts (door_logs with user info)
// ─────────────────────────────────────────
router.get("/alerts", verifyToken, isAdmin, async (req, res) => {
  try {
    const logs = await prisma.doorLog.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });

    // Shape response to match original format
    const shaped = logs.map((log) => ({
      ...log,
      user_name:  log.user?.name  || null,
      user_email: log.user?.email || null,
      user:       undefined,
    }));

    res.json(shaped);
  } catch (err) {
    console.error("Get alerts error:", err);
    res.status(500).json({ message: "Error fetching alerts" });
  }
});

module.exports = router;                                                      