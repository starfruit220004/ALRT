// routes/dashboardRoutes.js
const express = require("express");
const router  = express.Router();
const prisma  = require("../config/prisma");
const { verifyToken } = require("../middleware/authMiddleware");

// ─────────────────────────────────────────
// ACTIVITY LOGS (door_logs)
// ─────────────────────────────────────────

// GET this user's activity logs
router.get("/logs", verifyToken, async (req, res) => {
  try {
    const logs = await prisma.doorLog.findMany({
      where:   { userId: req.user.id },
      orderBy: { createdAt: "desc" },
    });
    res.json(logs);
  } catch (err) {
    console.error("Error fetching logs:", err.message);
    res.status(500).json({ message: "Server error fetching logs" });
  }
});

// DELETE single activity log
router.delete("/logs/:id", verifyToken, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    // findFirst checks both id AND userId — user can only delete own logs
    const log = await prisma.doorLog.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!log) {
      return res.status(404).json({ message: "Log not found or not yours" });
    }

    await prisma.doorLog.delete({ where: { id } });
    res.json({ message: "Log deleted" });
  } catch (err) {
    console.error("Error deleting log:", err.message);
    res.status(500).json({ message: "Server error deleting log" });
  }
});

// DELETE all activity logs for this user
router.delete("/logs", verifyToken, async (req, res) => {
  try {
    await prisma.doorLog.deleteMany({
      where: { userId: req.user.id },
    });
    res.json({ message: "Your activity logs cleared" });
  } catch (err) {
    console.error("Error clearing logs:", err.message);
    res.status(500).json({ message: "Server error clearing logs" });
  }
});

// ─────────────────────────────────────────
// SMS LOGS (sms_logs)
// ─────────────────────────────────────────

// GET this user's SMS logs
router.get("/sms-logs", verifyToken, async (req, res) => {
  try {
    const logs = await prisma.smsLog.findMany({
      where:   { userId: req.user.id },
      orderBy: { createdAt: "desc" },
    });
    res.json(logs);
  } catch (err) {
    console.error("Error fetching SMS logs:", err.message);
    res.status(500).json({ message: "Server error fetching SMS logs" });
  }
});

// POST — called by ESP32 to save SMS log
router.post("/sms-logs", async (req, res) => {
  try {
    const { user_id, status, message } = req.body;

    const log = await prisma.smsLog.create({
      data: {
        userId:  parseInt(user_id, 10),
        status:  status  || null,
        message: message || null,
      },
    });

    const io = req.app.get("socketio");
    if (io) {
      io.to(`user_${user_id}`).emit("sms_update", log);
    }

    res.json({ message: "SMS log saved successfully", log });
  } catch (err) {
    console.error("Error saving SMS log:", err.message);
    res.status(500).json({ error: "Server error saving SMS log" });
  }
});

// DELETE single SMS log
router.delete("/sms-logs/:id", verifyToken, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const log = await prisma.smsLog.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!log) {
      return res.status(404).json({ message: "SMS log not found or not yours" });
    }

    await prisma.smsLog.delete({ where: { id } });
    res.json({ message: "SMS log deleted" });
  } catch (err) {
    console.error("Error deleting SMS log:", err.message);
    res.status(500).json({ message: "Server error deleting SMS log" });
  }
});

// DELETE all SMS logs for this user
router.delete("/sms-logs", verifyToken, async (req, res) => {
  try {
    await prisma.smsLog.deleteMany({
      where: { userId: req.user.id },
    });
    res.json({ message: "Your SMS logs cleared" });
  } catch (err) {
    console.error("Error clearing SMS logs:", err.message);
    res.status(500).json({ message: "Server error clearing SMS logs" });
  }
});

module.exports = router;