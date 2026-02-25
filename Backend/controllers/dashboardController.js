const pool = require('../config/db');

exports.getLogs = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM door_logs ORDER BY created_at DESC' // <-- use door_logs
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching logs:', err.message);
        res.status(500).json({ message: 'Server error fetching logs' });
    }
};