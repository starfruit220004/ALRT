const express = require('express');
const cors = require('cors');
const mqtt = require('mqtt');
const http = require('http');
const { Server } = require('socket.io');
const pool = require('./config/db');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// SOCKET.IO
const io = new Server(server, {
  cors: { origin: "*" }
});

// MIDDLEWARE
app.use(cors());
app.use(express.json());

// ROUTES
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/iot',       require('./routes/iotRoutes')); 


// MQTT SETUP
const brokerUrl = process.env.MQTT_BROKER || 'mqtt://broker.hivemq.com:1883';
const topic = 'Smart_Alert/test';

const mqttClient = mqtt.connect(brokerUrl);

mqttClient.on('connect', () => {
  console.log('✅ Connected to MQTT Broker');
  mqttClient.subscribe(topic, (err) => {
    if (err) console.error('MQTT subscribe error:', err);
  });
});

// WHEN MESSAGE RECEIVED FROM ESP32
mqttClient.on('message', async (receivedTopic, message) => {
  const payload = message.toString();
  console.log(`📡 MQTT: ${payload}`);

  try {
    await pool.query(
      "INSERT INTO door_logs(status, created_at) VALUES($1, NOW())",
      [payload]
    );

    io.emit("door_update", {
      status: payload,
      created_at: new Date()
    });

  } catch (err) {
    console.error('DB error inserting log:', err.message);
  }
});

// SOCKET CONNECTION
io.on("connection", (socket) => {
  console.log("⚡ Frontend connected via Socket.IO");
});

// TEST ROOT
app.get('/', (req, res) => res.send('🚀 Server is running'));

// START SERVER
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});