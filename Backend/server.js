require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const mqtt = require('mqtt');
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

// ─────────────────────────────────────────
// MQTT SETUP
// ─────────────────────────────────────────
const brokerUrl    = process.env.MQTT_BROKER || 'mqtt://broker.hivemq.com:1883';
const VALID_STATUSES = ['OPEN', 'CLOSE', 'Opened', 'Closed', 'Alarm'];
const clientId     = `SmartAlert_Backend_${Math.random().toString(16).slice(2, 8)}`;

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
    const result = await pool.query('SELECT id FROM users');
    const users  = result.rows;

    if (users.length === 0) {
      console.warn('⚠️  No users found in DB to subscribe to.');
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
  const payload = message.toString().trim();

  if (!VALID_STATUSES.includes(payload)) {
    console.warn(`⚠️  Ignoring invalid payload "${payload}" on topic: ${receivedTopic}`);
    return;
  }

  console.log(`📡 MQTT [${receivedTopic}]: ${payload}`);

  const parts       = receivedTopic.split('/');
  const userSegment = parts[1];

  if (!userSegment || !userSegment.startsWith('user_')) {
    console.warn(`⚠️  Could not extract user_id from topic: ${receivedTopic}`);
    return;
  }

  const userId = parseInt(userSegment.replace('user_', ''), 10);
  if (isNaN(userId)) {
    console.warn(`⚠️  Invalid user_id in topic: ${receivedTopic}`);
    return;
  }

  try {
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

    console.log(`✅ Log saved for user_${userId}: ${payload}`);

    const settingsResult = await pool.query(
      'SELECT * FROM settings WHERE user_id = $1',
      [userId]
    );
    const s = settingsResult.rows[0];
    if (!s) {
      console.warn(`⚠️  No settings found for user_${userId}`);
      return;
    }

    if (s.alarm_enabled && (payload === 'Alarm' || payload === 'OPEN')) {
      console.log(`🔔 Alarm triggered for user_${userId}`);
      io.to(`user_${userId}`).emit('trigger_alarm', {
        status:  payload,
        user_id: userId,
      });
    }

    if (s.sms_enabled && (payload === 'Alarm' || payload === 'OPEN')) {
      console.log(`📱 SMS triggered for user_${userId}: ${payload}`);
    }

  } catch (err) {
    console.error('❌ DB error inserting log:', err.message);
  }
});

mqttClient.on('error', (err) => {
  console.error('❌ MQTT error:', err.message);
});

mqttClient.on('disconnect', () => {
  console.warn('⚠️  MQTT disconnected.');
  isSubscribed = false;
});

mqttClient.on('reconnect', () => {
  console.log('🔄 MQTT reconnecting...');
  isSubscribed = false;
});

// ─────────────────────────────────────────
// SOCKET.IO
// ─────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`⚡ Socket connected: ${socket.id}`);

  socket.on('join_user_room', (userId) => {
    if (userId) {
      socket.join(`user_${userId}`);
      console.log(`👤 Socket ${socket.id} joined room user_${userId}`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// ─────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────
app.get('/', (req, res) => res.send('🚀 Smart Alert server running'));

// ─────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});