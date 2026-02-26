const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
const bcrypt = require('bcrypt');

// GET all users
router.get('/users', verifyToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, role FROM users ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// CREATE user
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
    res.status(201).json(result.rows[0]);
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
      'UPDATE users SET name=$1, email=$2, role=$3 WHERE id=$4 RETURNING id, name, email, role',
      [name, email, role, id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'User not found' });

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Error updating user' });
  }
});

// DELETE user
router.delete('/users/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM users WHERE id=$1 RETURNING id', [id]);
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting user' });
  }
});

// GET alerts
router.get('/alerts', verifyToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM door_logs ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching alerts' });
  }
});

module.exports = router;