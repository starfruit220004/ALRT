// routes/settingsRoutes.js
const express = require("express");
const router  = express.Router();
const prisma  = require("../config/prisma");
const { toggleAlarm, toggleSMS, getSettings, updateSchedule } = require("../controllers/settingsController");
const { verifyToken } = require("../middleware/authMiddleware");

const { isWithinSchedule } = require("../utils/timeHelper");

// ── Authenticated routes (React frontend)
// NOTE: These must be declared BEFORE /:userId to prevent Express from
// misinterpreting "/alarm" or "/sms" as a userId param.
router.get ("/",      verifyToken, getSettings);
router.post("/alarm", verifyToken, toggleAlarm);
router.post("/sms",   verifyToken, toggleSMS);
router.post("/schedule", verifyToken, updateSchedule);

// ── Public GET /:userId — used by ESP32 (no auth token on hardware)
router.get("/:userId", async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  if (isNaN(userId)) return res.status(400).json({ message: "Invalid userId" });

  try {
    let settings = await prisma.settings.findUnique({ where: { userId } });

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
      console.log(`[Settings] Auto-created settings for userId ${userId}`);
    }

    const scheduleActive = isWithinSchedule(settings.scheduleStart, settings.scheduleEnd);

    // ✅ FIX: Only tell the ESP32 that alarm/sms are enabled IF it is within the schedule.
    // This solves the issue where the hardware alarms outside the scheduled time.
    res.json({
      alarmEnabled:  settings.alarmEnabled && scheduleActive,
      smsEnabled:    settings.smsEnabled   && scheduleActive,
      scheduleStart: settings.scheduleStart,
      scheduleEnd:   settings.scheduleEnd,
    });
  } catch (err) {
    console.error("[Settings] ESP32 fetch error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;