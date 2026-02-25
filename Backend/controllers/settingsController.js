const pool = require('../config/db');

exports.getSettings = async (req, res) => {
    const result = await pool.query('SELECT * FROM settings LIMIT 1');
    res.json(result.rows[0]);
};

exports.toggleAlarm = async (req, res) => {
    const { value } = req.body;

    await pool.query(
        'UPDATE settings SET alarm_enabled = $1 WHERE id = 1',
        [value]
    );

    res.json({ message: 'Alarm updated' });
};

exports.toggleSMS = async (req, res) => {
    const { value } = req.body;

    await pool.query(
        'UPDATE settings SET sms_enabled = $1 WHERE id = 1',
        [value]
    );

    res.json({ message: 'SMS updated' });
};