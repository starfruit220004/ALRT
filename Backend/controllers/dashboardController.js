const pool = require('../config/db');

// ── Activity Logs (door_logs) ──────────────────────────────
exports.getLogs = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      'SELECT * FROM door_logs WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching activity logs:', err.message);
    res.status(500).json({ message: 'Server error fetching logs' });
  }
};

// ── SMS Logs (sms_logs) ────────────────────────────────────
exports.getSmsLogs = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      'SELECT * FROM sms_logs WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching SMS logs:', err.message);
    res.status(500).json({ message: 'Server error fetching SMS logs' });
  }
};

// ── Delete single Activity Log ─────────────────────────────
exports.deleteLog = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    await pool.query(
      'DELETE FROM door_logs WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    res.json({ message: 'Activity log deleted' });
  } catch (err) {
    console.error('Error deleting activity log:', err.message);
    res.status(500).json({ message: 'Server error deleting log' });
  }
};

// ── Delete single SMS Log ──────────────────────────────────
exports.deleteSmsLog = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    await pool.query(
      'DELETE FROM sms_logs WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    res.json({ message: 'SMS log deleted' });
  } catch (err) {
    console.error('Error deleting SMS log:', err.message);
    res.status(500).json({ message: 'Server error deleting SMS log' });
  }
};