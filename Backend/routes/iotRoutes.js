const express = require('express');
const router  = express.Router();
const { receiveDoorData, getDeviceUser } = require('../controllers/iotController');

// HTTP fallback for door events (used when MQTT is down)
router.post('/door', receiveDoorData);

// ✅ NEW: ESP32 calls this on startup with its MAC address
// to get the correct userId dynamically.
// Example: GET /api/iot/device/AA:BB:CC:DD:EE:FF
router.get('/device/:mac', getDeviceUser);

module.exports = router;