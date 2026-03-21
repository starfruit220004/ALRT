const express = require('express');
const router  = require('express').Router();
const pool    = require('../config/db');
const { toggleAlarm, toggleSMS, getSettings } = require('../controllers/settingsController');
const { verifyToken } = require('../middleware/authMiddleware');

// ─────────────────────────────────────────
// AUTHENTICATED ROUTES (Frontend)
// ─────────────────────────────────────────
router.get ('/',      verifyToken, getSettings);
router.post('/alarm', verifyToken, toggleAlarm);
router.post('/sms',   verifyToken, toggleSMS);

// ─────────────────────────────────────────
// PUBLIC ROUTE (ESP32 — no token required)
// Must be LAST to avoid intercepting /alarm and /sms
// ─────────────────────────────────────────
router.get('/:userId', async (req, res) => {
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
    console.error('Error fetching settings for ESP32:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;