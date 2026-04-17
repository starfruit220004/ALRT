/*
  ═══════════════════════════════════════════════════════
  CHANGES FROM ORIGINAL:
  FIX — Duplicate logging removed.

  The original iotController wrote to door_logs, sms_logs,
  and emitted socket events. The MQTT handler in server.js
  does exactly the same thing. When MQTT is working (which
  is the production path), BOTH ran for every door event,
  resulting in:
    - Every event appearing twice in the activity log
    - Every event appearing twice in SMS history
    - Dashboard counts (Total Opened, Total Alarms) doubled
    - Two socket emissions per event causing UI flicker

  This file is now a lightweight HTTP fallback ONLY — useful
  for testing when MQTT is down. It still logs to the DB
  and emits socket events, but it's no longer wired to run
  alongside MQTT simultaneously.

  If you want to use this route for testing:
    POST /api/iot/door  { "status": "OPEN", "userId": 1 }

  In production with MQTT running, you don't call this
  route at all — the ESP32 publishes via MQTT only.
  ═══════════════════════════════════════════════════════
*/

const prisma = require('../config/prisma');

exports.receiveDoorData = async (req, res) => {
  try {
    const { status, userId } = req.body;
    const io = req.app.get("socketio");

    if (!userId) return res.status(400).json({ error: 'userId is required' });
    const id = parseInt(userId, 10);

    // Validate status to avoid garbage writes
    const VALID = ["OPEN", "CLOSE", "Opened", "Closed", "Alarm"];
    if (!VALID.includes(status)) {
      return res.status(400).json({ error: `Invalid status: ${status}` });
    }

    // 1. Log the door event
    const savedLog = await prisma.doorLog.create({
      data: { status, userId: id },
    });
    if (io) io.to(`user_${id}`).emit("door_update", savedLog);

    // 2. Fetch settings
    const settings = await prisma.settings.findUnique({ where: { userId: id } });
    if (!settings) return res.status(404).json({ error: 'Settings not found for user' });

    // 3. Alarm + SMS logic (mirrors MQTT handler in server.js)
    if (status === 'OPEN' || status === 'Opened') {
      const smsLog = await prisma.smsLog.create({ data: { status, userId: id } });
      if (io) io.to(`user_${id}`).emit("sms_update", smsLog);

      if (settings.alarmEnabled) {
        console.log(`[IoT HTTP] Alarm triggered for user ${id}`);
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
    res.status(500).json({ error: 'Server error processing door data' });
  }
};