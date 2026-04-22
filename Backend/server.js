require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const http       = require('http');
const cron       = require('node-cron');
const { Server } = require('socket.io');
const prisma     = require('./config/prisma');
const mqttClient = require('./config/mqtt');

const app    = express();
const server = http.createServer(app);

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

console.log('[CORS] Allowed origins:', allowedOrigins);

const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'] },
});

// Set socketio immediately after io is created, before any routes load
app.set('socketio', io);

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

// Set headers for COOP to allow Google OAuth popup communication
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  next();
});

// ── Routes
app.use('/api/auth',      require('./routes/authRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/settings',  require('./routes/settingsRoutes'));
app.use('/api/admin',     require('./routes/adminRoutes'));
app.use('/api/iot',       require('./routes/iotRoutes'));
app.use('/api/users',     require('./routes/userRoutes'));
app.use('/api/cms',       require('./routes/cmsRoutes'));

// ── Daily cleanup: 17:00 UTC = 01:00 PHT (midnight Philippine time)
cron.schedule('0 17 * * *', async () => {
  try {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const deleted = await prisma.user.deleteMany({
      where: { isActive: false, deactivatedAt: { lte: oneYearAgo } },
    });
    if (deleted.count > 0)
      console.log(`[CRON] Auto-deleted ${deleted.count} inactive account(s)`);
  } catch (err) {
    console.error('[CRON] Auto-delete failed:', err.message);
  }
});

// ── Schedule check in Philippine Time (UTC+8)
function isWithinSchedule(scheduleStart, scheduleEnd) {
  if (!scheduleStart || !scheduleEnd) return true;
  
  // Use toLocaleString to get the current time in Manila, regardless of server location
  const phTimeStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" });
  const phDate = new Date(phTimeStr);
  const cur = phDate.getHours() * 60 + phDate.getMinutes();

  const toMin  = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const s = toMin(scheduleStart);
  const e = toMin(scheduleEnd);
  if (s <= e) return cur >= s && cur < e;
  return cur >= s || cur < e;
}

const VALID_STATUSES = ['OPEN', 'CLOSE', 'Opened', 'Closed', 'Alarm'];

// ── MQTT event handlers
mqttClient.on('connect', () => {
  console.log('[MQTT] Connected to broker');
  mqttClient.subscribe('Smart_Alert/+/door', (err) => {
    if (err) console.error('[MQTT] Subscribe error:', err.message);
    else     console.log('[MQTT] Subscribed: Smart_Alert/+/door');
  });
});

mqttClient.on('reconnect', () => console.log('[MQTT] Reconnecting to broker...'));
mqttClient.on('offline',   () => console.warn('[MQTT] Client went offline — will auto-reconnect'));
mqttClient.on('error',     (err) => console.error('[MQTT] Client error:', err.message));

mqttClient.on('message', async (receivedTopic, message) => {
  if (!message) return;
  const payload = message.toString().replace(/[\x00-\x1F\x7F]/g, '').trim();
  if (!VALID_STATUSES.includes(payload)) return;

  const parts       = receivedTopic.split('/');
  const userSegment = parts[1];
  if (!userSegment?.startsWith('user_')) return;

  const userId = parseInt(userSegment.replace('user_', ''), 10);
  if (isNaN(userId)) return;

  try {
    const user = await prisma.user.findUnique({
      where:  { id: userId },
      select: { isActive: true },
    });
    if (!user?.isActive) return;

    const savedLog = await prisma.doorLog.create({ data: { status: payload, userId } });
    io.to(`user_${userId}`).emit('door_update', savedLog);

    const settings = await prisma.settings.findUnique({ where: { userId } });
    if (!settings) return;

    if (payload === 'OPEN' || payload === 'Opened') {
      // ✅ FIX: Only create SMS log if smsEnabled is true
      if (settings.smsEnabled) {
        const smsLog = await prisma.smsLog.create({ data: { status: payload, userId } });
        io.to(`user_${userId}`).emit('sms_update', smsLog);
      }

      const scheduleActive = isWithinSchedule(settings.scheduleStart, settings.scheduleEnd);

      if (settings.alarmEnabled && scheduleActive) {
        console.log(`[MQTT] Alarm triggered for user_${userId} (within schedule PHT)`);
        const alarmDoor = await prisma.doorLog.create({ data: { status: 'Alarm', userId } });
        io.to(`user_${userId}`).emit('door_update', alarmDoor);

        // ✅ FIX: Only create alarm SMS log if smsEnabled is true
        if (settings.smsEnabled) {
          const alarmSms = await prisma.smsLog.create({ data: { status: 'Alarm', userId } });
          io.to(`user_${userId}`).emit('sms_update', alarmSms);
        }

        io.to(`user_${userId}`).emit('trigger_alarm', { status: payload, user_id: userId });
      } else if (settings.alarmEnabled && !scheduleActive) {
        console.log(`[MQTT] Alarm SKIPPED for user_${userId} — outside schedule (${settings.scheduleStart}–${settings.scheduleEnd} PHT)`);
      }
    }
  } catch (err) {
    console.error('[MQTT] DB error:', err.message);
  }
});

// ── Socket.io room management
io.on('connection', (socket) => {
  socket.on('join_user_room', (userId) => {
    if (userId) {
      socket.join(`user_${userId}`);
      console.log(`[Socket] User ${userId} joined room`);
    }
  });

  socket.on('leave_user_room', (userId) => {
    if (userId) {
      socket.leave(`user_${userId}`);
      console.log(`[Socket] User ${userId} left room`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

app.get('/', (req, res) => res.send('ALRT server running ✅'));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`[Server] Running on port ${PORT}`));