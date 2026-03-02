const pool = require('../config/db');

// FIX: original stub just did res.send('Users from controller') which
// conflicts with the real implementation in adminRoutes and breaks JSON clients.
exports.getUsers = async (req, res) => {
  try {
    const result = await pool.query("SELECT id, name, email, role FROM users ORDER BY id");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching users' });
  }
};