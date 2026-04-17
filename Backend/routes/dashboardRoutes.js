/*
  ═══════════════════════════════════════════════════════
  CHANGES FROM ORIGINAL:
  1. This file already used Prisma correctly for most
     routes. The only new fix here is the POST /sms-logs
     route: the original tried to write a `message` field
     that does NOT exist in the Prisma SmsLog schema,
     causing a runtime error. The field is now omitted
     from the create call. If you want to store message
     text, add `message String?` to the SmsLog model in
     schema.prisma and run `npx prisma migrate dev`.
  2. Added explicit error logging for easier debugging
     while the backend is running locally.
  ═══════════════════════════════════════════════════════
*/

const express = require("express");
const router  = express.Router();
const prisma  = require("../config/prisma");
const { verifyToken } = require("../middleware/authMiddleware");

// ─────────────────────────────────────────
// ACTIVITY LOGS (door_logs)
// ─────────────────────────────────────────

router.get("/logs", verifyToken, async (req, res) => {
  try {
    const logs = await prisma.doorLog.findMany({
      where:   { userId: req.user.id },
      orderBy: { createdAt: "desc" },
    });
    res.json(logs);
  } catch (err) {
    console.error("[Dashboard] getLogs error:", err.message);
    res.status(500).json({ message: "Server error fetching logs" });
  }
});

router.delete("/logs/:id", verifyToken, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const log = await prisma.doorLog.findFirst({
      where: { id, userId: req.user.id },
    });
    if (!log) return res.status(404).json({ message: "Log not found or not yours" });

    await prisma.doorLog.delete({ where: { id } });
    res.json({ message: "Log deleted" });
  } catch (err) {
    console.error("[Dashboard] deleteLog error:", err.message);
    res.status(500).json({ message: "Server error deleting log" });
  }
});

router.delete("/logs", verifyToken, async (req, res) => {
  try {
    await prisma.doorLog.deleteMany({ where: { userId: req.user.id } });
    res.json({ message: "Activity logs cleared" });
  } catch (err) {
    console.error("[Dashboard] clearLogs error:", err.message);
    res.status(500).json({ message: "Server error clearing logs" });
  }
});

// ─────────────────────────────────────────
// SMS LOGS (sms_logs)
// ─────────────────────────────────────────

router.get("/sms-logs", verifyToken, async (req, res) => {
  try {
    const logs = await prisma.smsLog.findMany({
      where:   { userId: req.user.id },
      orderBy: { createdAt: "desc" },
    });
    res.json(logs);
  } catch (err) {
    console.error("[Dashboard] getSmsLogs error:", err.message);
    res.status(500).json({ message: "Server error fetching SMS logs" });
  }
});

// Called by ESP32 to save an SMS log entry.
// ── FIX 1: Removed `message` from the create data — the
//    SmsLog model in schema.prisma has no `message` column.
//    The original code crashed with a Prisma validation error
//    every time the ESP32 tried to save an SMS log, which is
//    why the SMS history was always empty.
//    To store message text: add `message String?` to SmsLog
//    in schema.prisma, run `npx prisma migrate dev`, then
//    uncomment the message line below.
router.post("/sms-logs", async (req, res) => {
  try {
    const { user_id, status /*, message */ } = req.body;

    if (!user_id) return res.status(400).json({ error: "user_id is required" });

    const log = await prisma.smsLog.create({
      data: {
        userId: parseInt(user_id, 10),
        status: status || "sent",
        // message: message || null,  // uncomment after adding field to schema
      },
    });

    const io = req.app.get("socketio");
    if (io) io.to(`user_${user_id}`).emit("sms_update", log);

    res.json({ message: "SMS log saved", log });
  } catch (err) {
    console.error("[Dashboard] saveSmsLog error:", err.message);
    res.status(500).json({ error: "Server error saving SMS log" });
  }
});

router.delete("/sms-logs/:id", verifyToken, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const log = await prisma.smsLog.findFirst({
      where: { id, userId: req.user.id },
    });
    if (!log) return res.status(404).json({ message: "SMS log not found or not yours" });

    await prisma.smsLog.delete({ where: { id } });
    res.json({ message: "SMS log deleted" });
  } catch (err) {
    console.error("[Dashboard] deleteSmsLog error:", err.message);
    res.status(500).json({ message: "Server error deleting SMS log" });
  }
});

router.delete("/sms-logs", verifyToken, async (req, res) => {
  try {
    await prisma.smsLog.deleteMany({ where: { userId: req.user.id } });
    res.json({ message: "SMS logs cleared" });
  } catch (err) {
    console.error("[Dashboard] clearSmsLogs error:", err.message);
    res.status(500).json({ message: "Server error clearing SMS logs" });
  }
});

module.exports = router;