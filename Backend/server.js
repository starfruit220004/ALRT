require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const mqtt = require('mqtt');
const cron = require('node-cron');
const { Server } = require('socket.io');
const pool = require('./config/db');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────
app.use('/api/auth',      require('./routes/authRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/settings',  require('./routes/settingsRoutes'));
app.use('/api/admin',     require('./routes/adminRoutes'));
app.use('/api/iot',       require('./routes/iotRoutes'));
app.use('/api/users',     require('./routes/userRoutes'));
app.use('/api/cms',       require('./routes/cmsRoutes'));

// ─────────────────────────────────────────
// CRON — Auto-delete accounts deactivated for 1+ year
// ─────────────────────────────────────────
cron.schedule('0 0 * * *', async () => {
  try {
    const result = await pool.query(
      `DELETE FROM users
       WHERE is_active = FALSE
         AND deactivated_at IS NOT NULL
         AND deactivated_at <= NOW() - INTERVAL '1 year'
       RETURNING id, name, email`
    );
    if (result.rows.length > 0) {
      console.log(`🗑️  [CRON] Auto-deleted ${result.rows.length} account(s) inactive for 1+ year:`);
      result.rows.forEach(u => console.log(`   - User #${u.id} (${u.name} / ${u.email})`));
    }
  } catch (err) {
    console.error('❌ [CRON] Auto-delete failed:', err.message);
  }
});

// ─────────────────────────────────────────
// MQTT SETUP
// ─────────────────────────────────────────
const brokerUrl      = process.env.MQTT_BROKER || 'mqtt://broker.hivemq.com:1883';
const VALID_STATUSES = ['OPEN', 'CLOSE', 'Opened', 'Closed', 'Alarm'];
const clientId       = `SmartAlert_Backend_${Math.random().toString(16).slice(2, 8)}`;

const mqttClient = mqtt.connect(brokerUrl, {
  clientId,
  clean: true,
  reconnectPeriod: 5000,
  connectTimeout:  10000,
});

let isSubscribed = false;

mqttClient.on('connect', async () => {
  console.log('✅ Connected to MQTT Broker');

  if (isSubscribed) return;

  try {
    const result = await pool.query('SELECT id FROM users WHERE is_active = TRUE');
    const users  = result.rows;

    if (users.length === 0) {
      console.warn('⚠️ No active users found in DB to subscribe to.');
      return;
    }

    users.forEach(user => {
      const topic = `Smart_Alert/user_${user.id}/door`;
      mqttClient.subscribe(topic, (err) => {
        if (err) console.error(`❌ Subscribe error for ${topic}:`, err.message);
        else     console.log(`📡 Subscribed to: ${topic}`);
      });
    });

    isSubscribed = true;
  } catch (err) {
    console.error('❌ Failed to fetch users for MQTT subscribe:', err.message);
  }
});

mqttClient.on('message', async (receivedTopic, message) => {
  if (!message) return;
  const payload = message.toString().replace(/[\x00-\x1F\x7F]/g, '').trim();

  if (!VALID_STATUSES.includes(payload)) {
    console.warn(`⚠️ Ignoring invalid/noisy payload "${payload}" on topic: ${receivedTopic}`);
    return;
  }

  console.log(`📩 MQTT [${receivedTopic}]: ${payload}`);

  const parts       = receivedTopic.split('/');
  const userSegment = parts[1];

  if (!userSegment || !userSegment.startsWith('user_')) {
    console.warn(`Could not extract user_id from topic: ${receivedTopic}`);
    return;
  }

  const userId = parseInt(userSegment.replace('user_', ''), 10);
  if (isNaN(userId)) {
    console.warn(`Invalid user_id in topic: ${receivedTopic}`);
    return;
  }

  try {
    const userCheck = await pool.query('SELECT is_active FROM users WHERE id = $1', [userId]);
    if (!userCheck.rows[0]?.is_active) {
      console.warn(`⚠️ Ignoring MQTT message for deactivated user_${userId}`);
      return;
    }

    // ── Save to door_logs (activity log) ──────────────────
    const result = await pool.query(
      'INSERT INTO door_logs (status, user_id, created_at) VALUES ($1, $2, NOW()) RETURNING *',
      [payload, userId]
    );
    const savedLog = result.rows[0];

    io.to(`user_${userId}`).emit('door_update', {
      id:         savedLog.id,
      status:     savedLog.status,
      user_id:    savedLog.user_id,
      created_at: savedLog.created_at,
    });

    console.log(`💾 Activity log saved for user_${userId}: ${payload}`);

    const settingsResult = await pool.query(
      'SELECT * FROM settings WHERE user_id = $1',
      [userId]
    );
    const s = settingsResult.rows[0];
    if (!s) {
      console.warn(`No settings found for user_${userId}`);
      return;
    }

    // ── Save OPEN/Opened to sms_logs ──────────────────────
    if (payload === 'OPEN' || payload === 'Opened') {
      const smsResult = await pool.query(
        'INSERT INTO sms_logs (status, user_id, created_at) VALUES ($1, $2, NOW()) RETURNING *',
        [payload, userId]
      );
      const smsLog = smsResult.rows[0];

      io.to(`user_${userId}`).emit('sms_update', {
        id:         smsLog.id,
        status:     smsLog.status,
        user_id:    smsLog.user_id,
        created_at: smsLog.created_at,
      });

      console.log(`📱 SMS log saved for user_${userId}: ${payload}`);
    }

    // ── Alarm ──────────────────────────────────────────────
    if (s.alarm_enabled && payload === 'OPEN') {
      console.log(`🚨 Alarm triggered for user_${userId}`);

      // Save Alarm to door_logs
      const alarmResult = await pool.query(
        'INSERT INTO door_logs (status, user_id, created_at) VALUES ($1, $2, NOW()) RETURNING *',
        ['Alarm', userId]
      );
      const alarmLog = alarmResult.rows[0];

      io.to(`user_${userId}`).emit('door_update', {
        id:         alarmLog.id,
        status:     alarmLog.status,
        user_id:    alarmLog.user_id,
        created_at: alarmLog.created_at,
      });

      // Save Alarm to sms_logs
      const alarmSmsResult = await pool.query(
        'INSERT INTO sms_logs (status, user_id, created_at) VALUES ($1, $2, NOW()) RETURNING *',
        ['Alarm', userId]
      );
      const alarmSmsLog = alarmSmsResult.rows[0];

      io.to(`user_${userId}`).emit('sms_update', {
        id:         alarmSmsLog.id,
        status:     alarmSmsLog.status,
        user_id:    alarmSmsLog.user_id,
        created_at: alarmSmsLog.created_at,
      });

      io.to(`user_${userId}`).emit('trigger_alarm', {
        status:  payload,
        user_id: userId,
      });
    }

    if (s.sms_enabled && payload === 'OPEN') {
      console.log(`📱 SMS logic check for user_${userId}: ${payload}`);
    }

  } catch (err) {
    console.error('❌ DB error inserting log:', err.message);
  }
});

mqttClient.on('error', (err) => {
  console.error('❌ MQTT error:', err.message);
});

mqttClient.on('disconnect', () => {
  console.warn('📡 MQTT disconnected.');
  isSubscribed = false;
});

mqttClient.on('reconnect', () => {
  console.log('📡 MQTT reconnecting...');
  isSubscribed = false;
});

// ─────────────────────────────────────────
// SOCKET.IO
// ─────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  socket.on('join_user_room', (userId) => {
    if (userId) {
      socket.join(`user_${userId}`);
      console.log(`🏠 Socket ${socket.id} joined room user_${userId}`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// ─────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────
app.get('/', (req, res) => res.send('Smart Alert server running'));

// ─────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});