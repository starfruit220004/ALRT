const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
const bcrypt = require('bcrypt');

// GET all users — include mqtt_topic, is_active, deactivated_at
router.get('/users', verifyToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, mqtt_topic, is_active, deactivated_at FROM users ORDER BY id'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// CREATE user — auto-generate mqtt_topic
router.post('/users', verifyToken, isAdmin, async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const existing = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    if (existing.rows.length > 0)
      return res.status(400).json({ message: 'Email already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users(name, email, password, role) VALUES($1,$2,$3,$4) RETURNING id, name, email, role',
      [name, email, hashed, role || 'user']
    );

    const newUser = result.rows[0];

    // Auto-generate mqtt_topic
    const mqttTopic = `Smart_Alert/user_${newUser.id}/door`;
    await pool.query('UPDATE users SET mqtt_topic=$1 WHERE id=$2', [mqttTopic, newUser.id]);
    newUser.mqtt_topic = mqttTopic;

    res.status(201).json(newUser);
  } catch (err) {
    res.status(500).json({ message: 'Error creating user' });
  }
});

// UPDATE user
router.put('/users/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, email, role } = req.body;
  try {
    const result = await pool.query(
      `UPDATE users SET name=$1, email=$2, role=$3 WHERE id=$4
       RETURNING id, name, email, role, mqtt_topic, is_active, deactivated_at`,
      [name, email, role, id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Error updating user' });
  }
});

// DEACTIVATE user — blocks login, records deactivated_at for 1-year auto-delete
router.patch('/users/:id/deactivate', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'UPDATE users SET is_active=FALSE, deactivated_at=NOW() WHERE id=$1 RETURNING id',
      [id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Account deactivated.' });
  } catch (err) {
    console.error('Error deactivating user:', err.message);
    res.status(500).json({ message: 'Error deactivating user' });
  }
});

// ACTIVATE user — restores login access, clears deactivated_at
router.patch('/users/:id/activate', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'UPDATE users SET is_active=TRUE, deactivated_at=NULL WHERE id=$1 RETURNING id',
      [id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Account activated.' });
  } catch (err) {
    console.error('Error activating user:', err.message);
    res.status(500).json({ message: 'Error activating user' });
  }
});

// GET alerts — admin sees ALL logs from all users
router.get('/alerts', verifyToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT door_logs.*, users.name AS user_name, users.email AS user_email
      FROM door_logs
      LEFT JOIN users ON door_logs.user_id = users.id
      ORDER BY door_logs.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching alerts' });
  }
});

module.exports = router;