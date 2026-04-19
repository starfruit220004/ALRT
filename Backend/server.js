require("dotenv").config();
const express    = require("express");
const cors       = require("cors");
const http       = require("http");
const cron       = require("node-cron");
const { Server } = require("socket.io");
const prisma     = require("./config/prisma");
const mqttClient = require("./config/mqtt");

const app    = express();
const server = http.createServer(app);

// ✅ FIX: Removed hardcoded Vercel URL — use FRONTEND_URL env var only
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:5173",
  "http://localhost:5173",
];

const io = new Server(server, {
  cors: {
    origin:  allowedOrigins,
    methods: ["GET", "POST"],
  },
});

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
app.set("socketio", io);

app.use("/api/auth",      require("./routes/authRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/settings",  require("./routes/settingsRoutes"));
app.use("/api/admin",     require("./routes/adminRoutes"));
app.use("/api/iot",       require("./routes/iotRoutes"));
app.use("/api/users",     require("./routes/userRoutes"));
app.use("/api/cms",       require("./routes/cmsRoutes"));

// ── Daily cleanup cron: delete inactive accounts after 1 year
cron.schedule("0 0 * * *", async () => {
  try {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const deleted = await prisma.user.deleteMany({
      where: { isActive: false, deactivatedAt: { lte: oneYearAgo } },
    });
    if (deleted.count > 0)
      console.log(`[CRON] Auto-deleted ${deleted.count} inactive account(s)`);
  } catch (err) {
    console.error("[CRON] Auto-delete failed:", err.message);
  }
});

// ✅ FIX: isWithinSchedule now uses Philippine Time (UTC+8)
// Render servers run in UTC — without this offset, "08:00" meant
// 08:00 UTC = 4:00 PM Philippine time, causing alarms to always
// be skipped during normal daytime hours.
function isWithinSchedule(scheduleStart, scheduleEnd) {
  if (!scheduleStart || !scheduleEnd) return true;

  // Convert current UTC time to Philippine time (UTC+8)
  const now = new Date();
  const phTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const cur = phTime.getUTCHours() * 60 + phTime.getUTCMinutes();

  const toMin = (t) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const s = toMin(scheduleStart);
  const e = toMin(scheduleEnd);

  // Normal range (e.g. 08:00–17:00)
  if (s <= e) return cur >= s && cur < e;
  // Overnight range (e.g. 22:00–06:00)
  return cur >= s || cur < e;
}

const VALID_STATUSES = ["OPEN", "CLOSE", "Opened", "Closed", "Alarm"];

mqttClient.on("connect", () => {
  console.log("[MQTT] Connected to broker");
  mqttClient.subscribe("Smart_Alert/+/door", (err) => {
    if (err) console.error("[MQTT] Subscribe error:", err.message);
    else     console.log("[MQTT] Subscribed: Smart_Alert/+/door");
  });
});

mqttClient.on("message", async (receivedTopic, message) => {
  if (!message) return;
  const payload = message.toString().replace(/[\x00-\x1F\x7F]/g, "").trim();
  if (!VALID_STATUSES.includes(payload)) return;

  const parts       = receivedTopic.split("/");
  const userSegment = parts[1];
  if (!userSegment?.startsWith("user_")) return;
  const userId = parseInt(userSegment.replace("user_", ""), 10);
  if (isNaN(userId)) return;

  try {
    const user = await prisma.user.findUnique({
      where:  { id: userId },
      select: { isActive: true },
    });
    if (!user?.isActive) return;

    // Write door log and emit to frontend
    const savedLog = await prisma.doorLog.create({ data: { status: payload, userId } });
    io.to(`user_${userId}`).emit("door_update", savedLog);

    const settings = await prisma.settings.findUnique({ where: { userId } });
    if (!settings) return;

    if (payload === "OPEN" || payload === "Opened") {
      // Write SMS log
      const smsLog = await prisma.smsLog.create({ data: { status: payload, userId } });
      io.to(`user_${userId}`).emit("sms_update", smsLog);

      // ✅ FIX: isWithinSchedule now uses Philippine Time (UTC+8)
      const scheduleActive = isWithinSchedule(settings.scheduleStart, settings.scheduleEnd);

      if (settings.alarmEnabled && scheduleActive) {
        console.log(`[MQTT] Alarm triggered for user_${userId} — within schedule window (PHT)`);

        const alarmLog = await prisma.doorLog.create({ data: { status: "Alarm", userId } });
        io.to(`user_${userId}`).emit("door_update", alarmLog);

        const alarmSms = await prisma.smsLog.create({ data: { status: "Alarm", userId } });
        io.to(`user_${userId}`).emit("sms_update", alarmSms);

        io.to(`user_${userId}`).emit("trigger_alarm", { status: payload, user_id: userId });
      } else if (settings.alarmEnabled && !scheduleActive) {
        console.log(`[MQTT] Alarm SKIPPED for user_${userId} — outside schedule window (${settings.scheduleStart}–${settings.scheduleEnd}) PHT`);
      }
    }
  } catch (err) {
    console.error("[MQTT] DB error:", err.message);
  }
});

io.on("connection", (socket) => {
  socket.on("join_user_room", (userId) => {
    if (userId) socket.join(`user_${userId}`);
  });
});

app.get("/", (req, res) => res.send("Smart Alert server running"));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`[Server] Running on port ${PORT}`));