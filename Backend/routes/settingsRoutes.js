/*
  ═══════════════════════════════════════════════════════
  routes/settingsRoutes.js
  ───────────────────────────────────────────────────────
  FIXES FROM ORIGINAL:
  1. CRITICAL: module.exaports → module.exports
     The typo caused this entire route file to never load.
     Result: all settings endpoints returned 404, ESP32
     could not fetch settings, and frontend toggles did
     nothing silently.
  2. Public GET /:userId route returns explicit camelCase
     keys (alarmEnabled, smsEnabled, scheduleStart,
     scheduleEnd) matching what ESP32 reads via ArduinoJson.
  3. Auto-creates settings row if missing so ESP32 never
     gets a 404 on first boot.
  ═══════════════════════════════════════════════════════
*/

const express = require("express");
const router  = express.Router();
const prisma  = require("../config/prisma");
const { toggleAlarm, toggleSMS, getSettings } = require("../controllers/settingsController");
const { verifyToken } = require("../middleware/authMiddleware");

// ── Authenticated routes (React frontend)
router.get ("/",      verifyToken, getSettings);
router.post("/alarm", verifyToken, toggleAlarm);
router.post("/sms",   verifyToken, toggleSMS);

// ── Public route — used by ESP32 (no auth token on hardware)
router.get("/:userId", async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  if (isNaN(userId)) return res.status(400).json({ message: "Invalid userId" });

  try {
    let settings = await prisma.settings.findUnique({ where: { userId } });

    // Auto-create defaults if this user has no settings row yet
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

    // Explicit camelCase response — matches ESP32 fetchSettings()
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

// ✅ FIX 1: was module.exaports — caused route to never register
module.exports = router;