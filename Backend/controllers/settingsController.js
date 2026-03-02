const pool = require('../config/db');

exports.getSettings = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM settings LIMIT 1');
    if (!result.rows[0]) {
      const created = await pool.query(
        'INSERT INTO settings (id, alarm_enabled, sms_enabled) VALUES (1, false, false) RETURNING *'
      );
      return res.json(created.rows[0]);
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching settings:', err.message);
    res.status(500).json({ message: 'Error fetching settings' });
  }
};

exports.toggleAlarm = async (req, res) => {
  const { value } = req.body;
  try {
    await pool.query('UPDATE settings SET alarm_enabled = $1 WHERE id = 1', [value]);
    console.log(`🔔 Alarm system ${value ? 'ENABLED' : 'DISABLED'}`);
    res.json({ message: 'Alarm updated', alarm_enabled: value });
  } catch (err) {
    console.error('Error updating alarm:', err.message);
    res.status(500).json({ message: 'Error updating alarm' });
  }
};

exports.toggleSMS = async (req, res) => {
  const { value } = req.body;
  try {
    await pool.query('UPDATE settings SET sms_enabled = $1 WHERE id = 1', [value]);
    console.log(`📱 SMS notifications ${value ? 'ENABLED' : 'DISABLED'}`);
    res.json({ message: 'SMS updated', sms_enabled: value });
  } catch (err) {
    console.error('Error updating SMS:', err.message);
    res.status(500).json({ message: 'Error updating SMS' });
  }
};