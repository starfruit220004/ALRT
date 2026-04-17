/*
  ═══════════════════════════════════════════════════════
  CHANGES FROM ORIGINAL:
  1. The public GET /:userId route (used by ESP32) now
     returns camelCase keys (alarmEnabled, smsEnabled,
     scheduleStart, scheduleEnd) explicitly. Prisma's
     default output is already camelCase, but this makes
     the contract clear and future-proof against any ORM
     changes. Previously ESP32 was reading snake_case
     keys that never existed in the response.
  ═══════════════════════════════════════════════════════
*/

const express = require("express");
const router  = express.Router();
const prisma  = require("../config/prisma");
const { toggleAlarm, toggleSMS, getSettings } = require("../controllers/settingsController");
const { verifyToken } = require("../middleware/authMiddleware");

// Authenticated routes used by the React frontend
router.get ("/",      verifyToken, getSettings);
router.post("/alarm", verifyToken, toggleAlarm);
router.post("/sms",   verifyToken, toggleSMS);

// ── Public route — used by ESP32 (no auth token on device)
//    FIX 1: Explicitly return camelCase keys so ESP32's
//    fetchSettings() can read alarmEnabled / smsEnabled /
//    scheduleStart / scheduleEnd correctly.
router.get("/:userId", async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  if (isNaN(userId)) return res.status(400).json({ message: "Invalid userId" });

  try {
    let settings = await prisma.settings.findUnique({
      where: { userId },
    });

    // Auto-create if missing so ESP32 never gets a 404
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          userId,
          alarmEnabled:  false,
          smsEnabled:    true,
          scheduleStart: "08:00",
          scheduleEnd:   "17:00",
        },
      });
    }

    // ── Explicit camelCase response — matches ESP32 fetchSettings()
    res.json({
      alarmEnabled:  settings.alarmEnabled,
      smsEnabled:    settings.smsEnabled,
      scheduleStart: settings.scheduleStart,
      scheduleEnd:   settings.scheduleEnd,
    });
  } catch (err) {
    console.error("[Settings] ESP32 fetch error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;