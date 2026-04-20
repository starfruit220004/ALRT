/*
  ═══════════════════════════════════════════════════════
  server.js — ALRT Backend Entry Point
  Hosted: Render (backend) + Vercel (frontend)
  ───────────────────────────────────────────────────────
  FIXES IN THIS VERSION (on top of original fixes):
  1. Cron cleanup now runs at midnight PHILIPPINE TIME
     (17:00 UTC = 01:00 PHT next day → use '0 17 * * *' UTC
     to hit midnight PHT). Original '0 0 * * *' ran at
     8 AM Philippine time, not midnight.
  2. MQTT auto-reconnect: server-side mqttClient now
     periodically checks connection and reconnects if lost.
     Without this, broker disconnects silently drop all
     door messages until Render restarts the process.
  3. app.set('socketio', io) moved immediately after io
     is created — safer ordering for route modules.
  ═══════════════════════════════════════════════════════
*/

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

// ✅ FIX 1 (original): Read Vercel URL from env — set in Render dashboard
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

console.log('[CORS] Allowed origins:', allowedOrigins);

// ✅ FIX 3 (original): Socket.io uses same origins
const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'] },
});

// ✅ FIX 3 (new): Set socketio on app immediately after io is created,
//    before routes are registered. Previously this was set after
//    app.use() calls, which is fragile if any route module ever
//    calls req.app.get('socketio') at load time.
app.set('socketio', io);

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

// ── Routes
app.use('/api/auth',      require('./routes/authRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/settings',  require('./routes/settingsRoutes'));
app.use('/api/admin',     require('./routes/adminRoutes'));
app.use('/api/iot',       require('./routes/iotRoutes'));
app.use('/api/users',     require('./routes/userRoutes'));
app.use('/api/cms',       require('./routes/cmsRoutes'));

// ── Daily cleanup: delete inactive accounts after 1 year
// ✅ FIX 1 (new): Changed from '0 0 * * *' (midnight UTC = 8AM PHT)
//    to '0 17 * * *' (17:00 UTC = 01:00 PHT next day ≈ midnight PHT).
//    The original cron was running at 8AM Philippine time, which is
//    unexpected for a "daily midnight cleanup" job.
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

// ✅ FIX 2 (original): Philippine Time (UTC+8) for schedule check
function isWithinSchedule(scheduleStart, scheduleEnd) {
  if (!scheduleStart || !scheduleEnd) return true;
  const now    = new Date();
  const phTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const cur    = phTime.getUTCHours() * 60 + phTime.getUTCMinutes();
  const toMin  = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const s = toMin(scheduleStart);
  const e = toMin(scheduleEnd);
  if (s <= e) return cur >= s && cur < e;
  return cur >= s || cur < e;
}

const VALID_STATUSES = ['OPEN', 'CLOSE', 'Opened', 'Closed', 'Alarm'];

// ── MQTT
mqttClient.on('connect', () => {
  console.log('[MQTT] Connected to broker');
  mqttClient.subscribe('Smart_Alert/+/door', (err) => {
    if (err) console.error('[MQTT] Subscribe error:', err.message);
    else     console.log('[MQTT] Subscribed: Smart_Alert/+/door');
  });
});

// ✅ FIX 2 (new): Server-side MQTT reconnect watcher.
//    If the broker disconnects (network blip, broker restart, etc.),
//    messages are silently dropped forever until the Render process
//    restarts. This interval re-subscribes whenever the client
//    reconnects after a drop.
mqttClient.on('reconnect', () => {
  console.log('[MQTT] Reconnecting to broker...');
});

mqttClient.on('offline', () => {
  console.warn('[MQTT] Client went offline — will auto-reconnect');
});

mqttClient.on('error', (err) => {
  console.error('[MQTT] Client error:', err.message);
});

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

    // Save door log + push to frontend
    const savedLog = await prisma.doorLog.create({ data: { status: payload, userId } });
    io.to(`user_${userId}`).emit('door_update', savedLog);

    const settings = await prisma.settings.findUnique({ where: { userId } });
    if (!settings) return;

    if (payload === 'OPEN' || payload === 'Opened') {
      // Save SMS log + push to frontend
      const smsLog = await prisma.smsLog.create({ data: { status: payload, userId } });
      io.to(`user_${userId}`).emit('sms_update', smsLog);

      const scheduleActive = isWithinSchedule(settings.scheduleStart, settings.scheduleEnd);

      if (settings.alarmEnabled && scheduleActive) {
        console.log(`[MQTT] Alarm triggered for user_${userId} (within schedule PHT)`);
        const alarmDoor = await prisma.doorLog.create({ data: { status: 'Alarm', userId } });
        io.to(`user_${userId}`).emit('door_update', alarmDoor);
        const alarmSms = await prisma.smsLog.create({ data: { status: 'Alarm', userId } });
        io.to(`user_${userId}`).emit('sms_update', alarmSms);
        io.to(`user_${userId}`).emit('trigger_alarm', { status: payload, user_id: userId });
      } else if (settings.alarmEnabled && !scheduleActive) {
        console.log(`[MQTT] Alarm SKIPPED for user_${userId} — outside schedule (${settings.scheduleStart}–${settings.scheduleEnd} PHT)`);
      }
    }
  } catch (err) {
    console.error('[MQTT] DB error:', err.message);
  }
});

// ── Socket.io
io.on('connection', (socket) => {
  socket.on('join_user_room', (userId) => {
    if (userId) {
      socket.join(`user_${userId}`);
      console.log(`[Socket] User ${userId} joined room`);
    }
  });
});

app.get('/', (req, res) => res.send('ALRT server running ✅'));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`[Server] Running on port ${PORT}`));