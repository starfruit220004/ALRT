const express = require('express');
const cors = require('cors');
const mqtt = require('mqtt');
const http = require('http');
const { Server } = require('socket.io');
const pool = require('./config/db');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(cors());
app.use(express.json());

// ROUTES
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/auth',      require('./routes/authRoutes'));
app.use('/api/admin',     require('./routes/adminRoutes'));
app.use('/api/settings',  require('./routes/settingsRoutes'));
app.use('/api/iot',       require('./routes/iotRoutes'));
app.use('/api/users',     require('./routes/userRoutes'));

// MQTT SETUP
const brokerUrl = process.env.MQTT_BROKER || 'mqtt://broker.hivemq.com:1883';
const wildcardTopic = 'Smart_Alert/+/door';

const mqttClient = mqtt.connect(brokerUrl);

mqttClient.on('connect', () => {
  console.log('✅ Connected to MQTT Broker');
  mqttClient.subscribe(wildcardTopic, (err) => {
    if (err) console.error('❌ MQTT subscribe error:', err);
    else console.log(`📡 Subscribed to: ${wildcardTopic}`);
  });
});

mqttClient.on('message', async (receivedTopic, message) => {
  const payload = message.toString().trim();
  console.log(`📡 MQTT [${receivedTopic}]: ${payload}`);

  const parts = receivedTopic.split('/');
  const userSegment = parts[1];

  if (!userSegment || !userSegment.startsWith('user_')) {
    console.warn(`⚠️ Could not extract user_id from topic: ${receivedTopic}`);
    return;
  }

  const userId = parseInt(userSegment.replace('user_', ''), 10);
  if (isNaN(userId)) {
    console.warn(`⚠️ Invalid user_id in topic: ${receivedTopic}`);
    return;
  }

  try {
    // Save log to DB
    const result = await pool.query(
      'INSERT INTO door_logs (status, user_id, created_at) VALUES ($1, $2, NOW()) RETURNING *',
      [payload, userId]
    );
    const savedLog = result.rows[0];

    // Emit real-time update to user's socket room
    io.to(`user_${userId}`).emit('door_update', {
      id:         savedLog.id,
      status:     savedLog.status,
      user_id:    savedLog.user_id,
      created_at: savedLog.created_at
    });

    console.log(`✅ Log saved for user_${userId}: ${payload}`);

    // Fetch latest settings
    const settings = await pool.query('SELECT * FROM settings WHERE id = 1');
    const s = settings.rows[0];

    if (!s) return;

    // 🔔 Trigger alarm sound on frontend via socket
    if (s.alarm_enabled && (payload === 'Alarm' || payload === 'OPEN')) {
      console.log(`🔔 Alarm triggered for user_${userId}`);
      io.to(`user_${userId}`).emit('trigger_alarm', {
        status: payload,
        user_id: userId
      });
    }

    // 📱 SMS
    if (s.sms_enabled && (payload === 'Alarm' || payload === 'OPEN')) {
      console.log(`📱 SMS triggered for user_${userId}: ${payload}`);
      // TODO: wire up Twilio here
    }

  } catch (err) {
    console.error('❌ DB error inserting log:', err.message);
  }
});

mqttClient.on('error', (err) => {
  console.error('❌ MQTT error:', err.message);
});

// Socket.IO
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

app.get('/', (req, res) => res.send('🚀 Smart Alert server running'));

module.exports = { app, io };

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});