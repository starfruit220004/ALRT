// routes/settingsRoutes.js
const express = require("express");
const router  = express.Router();
const prisma  = require("../config/prisma");
const { toggleAlarm, toggleSMS, getSettings } = require("../controllers/settingsController");
const { verifyToken } = require("../middleware/authMiddleware");

// Authenticated routes (React frontend)
router.get ("/",      verifyToken, getSettings);
router.post("/alarm", verifyToken, toggleAlarm);
router.post("/sms",   verifyToken, toggleSMS);

// Public route — used by ESP32 to fetch alarm/SMS state
// No token needed because ESP32 has no auth session
router.get("/:userId", async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  try {
    const settings = await prisma.settings.findUnique({
      where:  { userId },
      select: {
        alarmEnabled:  true,
        smsEnabled:    true,
        scheduleStart: true,
        scheduleEnd:   true,
      },
    });

    if (!settings) {
      return res.status(404).json({ message: "Settings not found" });
    }

    res.json(settings);
  } catch (err) {
    console.error("Error fetching settings for ESP32:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;