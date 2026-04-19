/*
  ═══════════════════════════════════════════════════════
  controllers/iotController.js
  ───────────────────────────────────────────────────────
  FIXES FROM ORIGINAL:
  1. getDeviceUser properly decodes URL-encoded MAC
     (%3A → :) before looking up the Device table.
  2. Returns userId as a String so ESP32's ArduinoJson
     can read it as either string or int.
  3. Clear console logs for every lookup so you can
     trace device registration in server logs.

  REQUIRES: Device table in your Prisma schema:
  ───────────────────────────────────────────────────────
  model Device {
    id        Int      @id @default(autoincrement())
    mac       String   @unique
    userId    Int
    user      User     @relation(fields: [userId], references: [id])
    createdAt DateTime @default(now())
  }
  And in User model add: devices Device[]

  After adding, run: npx prisma migrate dev --name add_device
  Then register your ESP32 MAC once:
  INSERT INTO "Device" ("mac","userId") VALUES ('AA:BB:CC:DD:EE:FF', 3);
  ═══════════════════════════════════════════════════════
*/

const prisma = require("../config/prisma");

// ── HTTP fallback when MQTT is unavailable
const receiveDoorData = async (req, res) => {
  const { status, userId } = req.body;
  if (!status || !userId)
    return res.status(400).json({ message: "Missing status or userId" });

  try {
    const log = await prisma.doorLog.create({
      data: { status, userId: parseInt(userId, 10) },
    });
    res.json(log);
  } catch (err) {
    console.error("[IoT] receiveDoorData error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ── Dynamic userId lookup by MAC address
// ESP32 sends its MAC on boot → server returns { userId: "3" }
const getDeviceUser = async (req, res) => {
  const mac = decodeURIComponent(req.params.mac).toUpperCase().trim();
  console.log(`[IoT] Device lookup — MAC: ${mac}`);

  if (!mac) return res.status(400).json({ message: "Missing MAC address" });

  try {
    const device = await prisma.device.findUnique({ where: { mac } });

    if (!device) {
      console.warn(`[IoT] Unknown MAC: ${mac} — not registered in Device table`);
      return res.status(404).json({
        message: "Device not registered. Add this MAC to the Device table.",
        mac,
      });
    }

    console.log(`[IoT] MAC ${mac} → userId ${device.userId}`);
    return res.json({ userId: String(device.userId) });
  } catch (err) {
    console.error("[IoT] getDeviceUser error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { receiveDoorData, getDeviceUser };