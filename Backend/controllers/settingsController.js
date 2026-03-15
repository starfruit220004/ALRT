const pool = require('../config/db');
const mqtt = require('mqtt');

// ── Use same MQTT client as server.js ──────────────────────
// Import the shared mqtt client
const mqttClient = mqtt.connect(process.env.MQTT_BROKER || 'mqtt://broker.hivemq.com:1883', {
  clientId: `SmartAlert_Settings_${Math.random().toString(16).slice(2, 8)}`,
  clean: true,
});

mqttClient.on('connect', () => {
  console.log('✅ Settings MQTT client connected');
});

mqttClient.on('error', (err) => {
  console.error('❌ Settings MQTT error:', err.message);
});

// ─────────────────────────────────────────
// GET SETTINGS
// ─────────────────────────────────────────
exports.getSettings = async (req, res) => {
  const userId = req.user.id;   // ← use logged in user
  try {
    const result = await pool.query(
      'SELECT * FROM settings WHERE user_id = $1',
      [userId]
    );

    if (!result.rows[0]) {
      const created = await pool.query(
        'INSERT INTO settings (alarm_enabled, sms_enabled, user_id) VALUES (false, false, $1) RETURNING *',
        [userId]
      );
      return res.json(created.rows[0]);
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching settings:', err.message);
    res.status(500).json({ message: 'Error fetching settings' });
  }
};

// ─────────────────────────────────────────
// TOGGLE ALARM
// ─────────────────────────────────────────
exports.toggleAlarm = async (req, res) => {
  const { value }  = req.body;
  const userId     = req.user.id;   // ← use logged in user
  try {
    await pool.query(
      'UPDATE settings SET alarm_enabled = $1 WHERE user_id = $2',
      [value, userId]
    );

    console.log(`🔔 Alarm ${value ? 'ENABLED' : 'DISABLED'} for user_${userId}`);

    // ── Notify ESP32 via MQTT ──────────────────────────────
    const topic = `Smart_Alert/user_${userId}/settings`;
    mqttClient.publish(topic, 'UPDATE', { retain: false }, (err) => {
      if (err) console.error('❌ MQTT publish error:', err.message);
      else     console.log(`📡 Notified ESP32: ${topic} → UPDATE`);
    });

    res.json({ message: 'Alarm updated', alarm_enabled: value });
  } catch (err) {
    console.error('Error updating alarm:', err.message);
    res.status(500).json({ message: 'Error updating alarm' });
  }
};

// ─────────────────────────────────────────
// TOGGLE SMS
// ─────────────────────────────────────────
exports.toggleSMS = async (req, res) => {
  const { value } = req.body;
  const userId    = req.user.id;   // ← use logged in user
  try {
    await pool.query(
      'UPDATE settings SET sms_enabled = $1 WHERE user_id = $2',
      [value, userId]
    );

    console.log(`📱 SMS ${value ? 'ENABLED' : 'DISABLED'} for user_${userId}`);

    // ── Notify ESP32 via MQTT ──────────────────────────────
    const topic = `Smart_Alert/user_${userId}/settings`;
    mqttClient.publish(topic, 'UPDATE', { retain: false }, (err) => {
      if (err) console.error('❌ MQTT publish error:', err.message);
      else     console.log(`📡 Notified ESP32: ${topic} → UPDATE`);
    });

    res.json({ message: 'SMS updated', sms_enabled: value });
  } catch (err) {
    console.error('Error updating SMS:', err.message);
    res.status(500).json({ message: 'Error updating SMS' });
  }
};