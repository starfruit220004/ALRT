// controllers/settingsController.js
const prisma     = require("../config/prisma");
const mqttClient = require("../config/mqtt");

// ─────────────────────────────────────────
// GET SETTINGS
// ─────────────────────────────────────────
exports.getSettings = async (req, res) => {
  const userId = req.user.id;
  try {
    let settings = await prisma.settings.findUnique({
      where: { userId },
    });

    if (!settings) {
      // Create default settings if none exist
      settings = await prisma.settings.create({
        data: {
          alarmEnabled:  false,
          smsEnabled:    false,
          scheduleStart: "08:00",
          scheduleEnd:   "17:00",
          userId,
        },
      });
    }

    res.json(settings);
  } catch (err) {
    console.error("Error fetching settings:", err.message);
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
    const updated = await prisma.settings.update({
      where: { userId },
      data: {
        alarmEnabled:  value,
        scheduleStart: scheduleStart || "08:00",
        scheduleEnd:   scheduleEnd   || "17:00",
      },
    });

    console.log(`Alarm ${value ? "ENABLED" : "DISABLED"} for user_${userId}`);

    const topic = `Smart_Alert/user_${userId}/settings`;
    mqttClient.publish(topic, "UPDATE", { retain: false }, (err) => {
      if (err) console.error("MQTT publish error:", err.message);
      else     console.log(`Notified ESP32: ${topic} → UPDATE`);
    });

    res.json({
      message:       "Alarm updated",
      alarm_enabled: updated.alarmEnabled,
      schedule_start: updated.scheduleStart,
      schedule_end:   updated.scheduleEnd,
    });
  } catch (err) {
    console.error("Error updating alarm:", err.message);
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
    const updated = await prisma.settings.update({
      where: { userId },
      data:  { smsEnabled: value },
    });

    console.log(`SMS ${value ? "ENABLED" : "DISABLED"} for user_${userId}`);

    const topic = `Smart_Alert/user_${userId}/settings`;
    mqttClient.publish(topic, "UPDATE", { retain: false }, (err) => {
      if (err) console.error("MQTT publish error:", err.message);
      else     console.log(`Notified ESP32: ${topic} → UPDATE`);
    });

    res.json({
      message:     "SMS updated",
      sms_enabled: updated.smsEnabled,
    });
  } catch (err) {
    console.error("Error updating SMS:", err.message);
    res.status(500).json({ message: "Error updating SMS" });
  }
};