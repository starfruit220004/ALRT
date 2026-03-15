const pool = require('../config/db');

exports.getUsers = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, role, phone FROM users ORDER BY id"  // ← ADD phone
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching users' });
  }
};