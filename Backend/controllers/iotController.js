const pool = require('../config/db');


exports.receiveDoorData = async (req, res) => {
    try {
        const { status } = req.body;

        await pool.query(
            'INSERT INTO door_logs (status) VALUES ($1)',
            [status]
        );

        const result = await pool.query('SELECT * FROM settings LIMIT 1');
        const settings = result.rows[0];

        if (settings.alarm_enabled && status === 'OPEN') {
            console.log('Alarm triggered');
        }

        if (settings.sms_enabled && status === 'OPEN') {
            console.log('SMS should be triggered (ESP32 side)');
        }

        res.json({ message: 'Door data saved' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};