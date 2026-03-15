const express = require('express');
const router = express.Router();
const pool = require('../config/db');              // ← ADD THIS
const {
    toggleAlarm,
    toggleSMS,
    getSettings
} = require('../controllers/settingsController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, getSettings);
router.post('/alarm', verifyToken, toggleAlarm);
router.post('/sms', verifyToken, toggleSMS);

// GET settings for a specific user (for ESP32)
router.get('/:userId', async (req, res) => {    // ← FIXED: removed extra /settings
  const { userId } = req.params;
  try {
    const result = await pool.query(
      'SELECT alarm_enabled, sms_enabled FROM settings WHERE user_id = $1',
      [userId]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'Settings not found' });

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching settings:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;