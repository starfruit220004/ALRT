/*
  ═══════════════════════════════════════════════════════
  CHANGES FROM ORIGINAL:
  1. toggleAlarm and toggleSMS now use prisma.settings.upsert
     instead of prisma.settings.update. The original would
     throw a Prisma P2025 "record not found" error for any
     user who doesn't have a settings row yet (e.g. users
     created before settings were auto-seeded). Upsert
     creates the row if it doesn't exist.
  2. Response keys are now explicitly camelCase to match
     what DoorContext and the ESP32 expect. Previously the
     raw Prisma object was returned which could cause
     confusion — now the shape is guaranteed.
  ═══════════════════════════════════════════════════════
*/

const prisma     = require("../config/prisma");
const mqttClient = require("../config/mqtt");

// ─────────────────────────────────────────
// GET SETTINGS
// ─────────────────────────────────────────
exports.getSettings = async (req, res) => {
  const userId = req.user.id;
  try {
    let settings = await prisma.settings.findUnique({ where: { userId } });

    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          alarmEnabled:  false,
          smsEnabled:    true,
          scheduleStart: "08:00",
          scheduleEnd:   "17:00",
          userId,
        },
      });
    }

    // Return explicit camelCase shape so frontend and ESP32 both agree
    res.json({
      alarmEnabled:  settings.alarmEnabled,
      smsEnabled:    settings.smsEnabled,
      scheduleStart: settings.scheduleStart,
      scheduleEnd:   settings.scheduleEnd,
    });
  } catch (err) {
    console.error("[Settings] getSettings error:", err.message);
    res.status(500).json({ message: "Error fetching settings" });
  }
};

// ─────────────────────────────────────────
// TOGGLE ALARM
// ─────────────────────────────────────────
exports.toggleAlarm = async (req, res) => {
  const { value, scheduleStart, scheduleEnd } = req.body;
  const userId = req.user.id;

  try {
    // ── FIX 1: upsert — safe even if settings row doesn't exist yet
    const updated = await prisma.settings.upsert({
      where:  { userId },
      update: {
        alarmEnabled:  value,
        scheduleStart: scheduleStart || "08:00",
        scheduleEnd:   scheduleEnd   || "17:00",
      },
      create: {
        userId,
        alarmEnabled:  value,
        smsEnabled:    true,
        scheduleStart: scheduleStart || "08:00",
        scheduleEnd:   scheduleEnd   || "17:00",
      },
    });

    console.log(`[Settings] Alarm ${value ? "ENABLED" : "DISABLED"} for user_${userId}`);

    // Notify ESP32 to re-fetch settings
    const topic = `Smart_Alert/user_${userId}/settings`;
    mqttClient.publish(topic, "UPDATE", { retain: false }, (err) => {
      if (err) console.error("[MQTT] Publish error:", err.message);
      else     console.log(`[MQTT] Notified ESP32: ${topic} → UPDATE`);
    });

    res.json({
      message:       "Alarm updated",
      alarmEnabled:  updated.alarmEnabled,
      scheduleStart: updated.scheduleStart,
      scheduleEnd:   updated.scheduleEnd,
    });
  } catch (err) {
    console.error("[Settings] toggleAlarm error:", err.message);
    res.status(500).json({ message: "Error updating alarm" });
  }
};

// ─────────────────────────────────────────
// TOGGLE SMS
// ─────────────────────────────────────────
exports.toggleSMS = async (req, res) => {
  const { value } = req.body;
  const userId    = req.user.id;

  try {
    // ── FIX 1: upsert — safe even if settings row doesn't exist yet
    const updated = await prisma.settings.upsert({
      where:  { userId },
      update: { smsEnabled: value },
      create: {
        userId,
        alarmEnabled: false,
        smsEnabled:   value,
        scheduleStart: "08:00",
        scheduleEnd:   "17:00",
      },
    });

    console.log(`[Settings] SMS ${value ? "ENABLED" : "DISABLED"} for user_${userId}`);

    const topic = `Smart_Alert/user_${userId}/settings`;
    mqttClient.publish(topic, "UPDATE", { retain: false }, (err) => {
      if (err) console.error("[MQTT] Publish error:", err.message);
      else     console.log(`[MQTT] Notified ESP32: ${topic} → UPDATE`);
    });

    res.json({
      message:    "SMS updated",
      smsEnabled: updated.smsEnabled,
    });
  } catch (err) {
    console.error("[Settings] toggleSMS error:", err.message);
    res.status(500).json({ message: "Error updating SMS" });
  }
};