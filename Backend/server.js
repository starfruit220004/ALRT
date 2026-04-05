// server.js
require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const http    = require("http");
const cron    = require("node-cron");
const { Server } = require("socket.io");
const prisma     = require("./config/prisma");
const mqttClient = require("./config/mqtt");

const app    = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin:  process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());
app.set("socketio", io);

app.use("/api/auth",      require("./routes/authRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/settings",  require("./routes/settingsRoutes"));
app.use("/api/admin",     require("./routes/adminRoutes"));
app.use("/api/iot",       require("./routes/iotRoutes"));
app.use("/api/users",     require("./routes/userRoutes"));
app.use("/api/cms",       require("./routes/cmsRoutes"));

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

const VALID_STATUSES = ["OPEN", "CLOSE", "Opened", "Closed", "Alarm"];

mqttClient.on("connect", () => {
  console.log("[MQTT] Connected to broker");
  mqttClient.subscribe("Smart_Alert/+/door", (err) => {
    if (err) console.error("[MQTT] Subscribe error:", err.message);
    else     console.log("[MQTT] Subscribed to wildcard: Smart_Alert/+/door");
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
      where: { id: userId }, select: { isActive: true },
    });
    if (!user?.isActive) return;

    const savedLog = await prisma.doorLog.create({ data: { status: payload, userId } });
    io.to(`user_${userId}`).emit("door_update", savedLog);

    const settings = await prisma.settings.findUnique({ where: { userId } });
    if (!settings) return;

    if (payload === "OPEN" || payload === "Opened") {
      const smsLog = await prisma.smsLog.create({ data: { status: payload, userId } });
      io.to(`user_${userId}`).emit("sms_update", smsLog);
    }

    if (settings.alarmEnabled && payload === "OPEN") {
      const alarmLog = await prisma.doorLog.create({ data: { status: "Alarm", userId } });
      io.to(`user_${userId}`).emit("door_update", alarmLog);
      const alarmSms = await prisma.smsLog.create({ data: { status: "Alarm", userId } });
      io.to(`user_${userId}`).emit("sms_update", alarmSms);
      io.to(`user_${userId}`).emit("trigger_alarm", { status: payload, user_id: userId });
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