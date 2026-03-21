const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');
const { verifyToken } = require('../middleware/authMiddleware');

// ─────────────────────────────────────────
// ACTIVITY LOGS (door_logs)
// ─────────────────────────────────────────

// GET — only this user's activity logs
router.get('/logs', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM door_logs WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching logs:', err.message);
    res.status(500).json({ message: 'Server error fetching logs' });
  }
});

// DELETE single activity log — only if it belongs to this user
router.delete('/logs/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM door_logs WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'Log not found or not yours' });
    res.json({ message: 'Log deleted' });
  } catch (err) {
    console.error('Error deleting log:', err.message);
    res.status(500).json({ message: 'Server error deleting log' });
  }
});

// DELETE all activity logs — only this user's logs
router.delete('/logs', verifyToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM door_logs WHERE user_id = $1', [req.user.id]);
    res.json({ message: 'Your activity logs cleared' });
  } catch (err) {
    console.error('Error clearing logs:', err.message);
    res.status(500).json({ message: 'Server error clearing logs' });
  }
});

// ─────────────────────────────────────────
// SMS LOGS (sms_logs)
// ─────────────────────────────────────────

// GET — only this user's SMS logs
router.get('/sms-logs', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM sms_logs WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching SMS logs:', err.message);
    res.status(500).json({ message: 'Server error fetching SMS logs' });
  }
});

// DELETE single SMS log — only if it belongs to this user
router.delete('/sms-logs/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM sms_logs WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'SMS log not found or not yours' });
    res.json({ message: 'SMS log deleted' });
  } catch (err) {
    console.error('Error deleting SMS log:', err.message);
    res.status(500).json({ message: 'Server error deleting SMS log' });
  }
});

// DELETE all SMS logs — only this user's logs
router.delete('/sms-logs', verifyToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM sms_logs WHERE user_id = $1', [req.user.id]);
    res.json({ message: 'Your SMS logs cleared' });
  } catch (err) {
    console.error('Error clearing SMS logs:', err.message);
    res.status(500).json({ message: 'Server error clearing SMS logs' });
  }
});

module.exports = router;