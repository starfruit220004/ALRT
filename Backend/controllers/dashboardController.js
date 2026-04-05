const pool = require('../config/db');

// Activity Logs 
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

// SMS Logs
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

// ADD THIS FUNCTION: Save SMS Log from ESP32
exports.saveSmsLog = async (req, res) => {
  try {
    const { user_id, status, message } = req.body;

    // 1. Insert into database
    const result = await pool.query(
      'INSERT INTO sms_logs (user_id, status, message) VALUES ($1, $2, $3) RETURNING *',
      [user_id, status, message]
    );

    const newLog = result.rows[0];

    // 2. Emit via Socket.io so React updates the table immediately
    const io = req.app.get('socketio');
    if (io) {
      io.to(`user_${user_id}`).emit('sms_update', newLog);
    }

    res.json({ message: 'SMS log saved and broadcasted', log: newLog });
  } catch (err) {
    console.error('Error saving SMS log:', err.message);
    res.status(500).json({ error: 'Server error saving SMS log' });
  }
};

// Delete single Activity Log
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

//  Delete single SMS Log
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