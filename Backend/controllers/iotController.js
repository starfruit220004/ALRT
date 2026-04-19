const prisma = require('../config/prisma');

// ─────────────────────────────────────────
// HTTP FALLBACK — door event via HTTP
// Only used when MQTT is down for testing.
// In production, ESP32 uses MQTT exclusively.
// ─────────────────────────────────────────
exports.receiveDoorData = async (req, res) => {
  try {
    const { status, userId } = req.body;
    const io = req.app.get("socketio");

    if (!userId) return res.status(400).json({ error: 'userId is required' });
    const id = parseInt(userId, 10);

    const VALID = ["OPEN", "CLOSE", "Opened", "Closed", "Alarm"];
    if (!VALID.includes(status)) {
      return res.status(400).json({ error: `Invalid status: ${status}` });
    }

    const savedLog = await prisma.doorLog.create({
      data: { status, userId: id },
    });
    if (io) io.to(`user_${id}`).emit("door_update", savedLog);

    const settings = await prisma.settings.findUnique({ where: { userId: id } });
    if (!settings) return res.status(404).json({ error: 'Settings not found for user' });

    if (status === 'OPEN' || status === 'Opened') {
      const smsLog = await prisma.smsLog.create({ data: { status, userId: id } });
      if (io) io.to(`user_${id}`).emit("sms_update", smsLog);

      if (settings.alarmEnabled) {
        const alarmLog = await prisma.doorLog.create({ data: { status: "Alarm", userId: id } });
        if (io) {
          io.to(`user_${id}`).emit("door_update", alarmLog);
          io.to(`user_${id}`).emit("trigger_alarm", { status, user_id: id });
        }
      }
    }

    res.json({ message: 'Door data processed (HTTP fallback)' });
  } catch (err) {
    console.error("[IoT HTTP] Error:", err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// ─────────────────────────────────────────
// GET DEVICE USER BY MAC ADDRESS
// ESP32 calls this on startup to get its
// userId dynamically instead of hardcoding.
//
// How it works:
// 1. ESP32 sends its MAC address
// 2. We look up which user has an mqttTopic
//    containing that MAC, OR we match by
//    the mqttTopic pattern Smart_Alert/user_X/door
// 3. Since mqttTopic = Smart_Alert/user_X/door,
//    we find the user whose device matches.
//
// For now, since each ESP32 is registered to
// one user, we match by finding the user whose
// mqttTopic is active (isActive=true, role=user).
//
// SETUP REQUIRED: In your database users table,
// add a column `deviceMac` VARCHAR and store the
// ESP32 MAC address for each user. Then the lookup
// becomes exact. Until then, this returns the first
// active non-admin user as a safe default.
// ─────────────────────────────────────────
exports.getDeviceUser = async (req, res) => {
  const { mac } = req.params;

  if (!mac) {
    return res.status(400).json({ error: 'MAC address is required' });
  }

  try {
    // Try to find user by deviceMac column if it exists
    // This is the ideal lookup once you add deviceMac to your schema
    let user = null;

    try {
      user = await prisma.user.findFirst({
        where: {
          deviceMac: mac.toUpperCase(),
          isActive:  true,
          role:      "user",
        },
        select: { id: true, mqttTopic: true },
      });
    } catch (schemaErr) {
      // deviceMac column doesn't exist yet — fall through to fallback
      console.log("[Device] deviceMac column not found, using mqttTopic fallback");
    }

    // Fallback: find user whose mqttTopic is set (active user with a device)
    if (!user) {
      user = await prisma.user.findFirst({
        where: {
          isActive:  true,
          role:      "user",
          mqttTopic: { not: null },
        },
        orderBy: { id: "asc" },
        select:  { id: true, mqttTopic: true },
      });
    }

    if (!user) {
      return res.status(404).json({ error: 'No active user found for this device' });
    }

    console.log(`[Device] MAC ${mac} → userId ${user.id} (topic: ${user.mqttTopic})`);

    res.json({
      userId:    user.id,
      mqttTopic: user.mqttTopic,
    });
  } catch (err) {
    console.error("[Device] getDeviceUser error:", err.message);
    res.status(500).json({ error: 'Server error' });
  }
};