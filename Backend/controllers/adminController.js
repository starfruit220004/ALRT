const pool = require('../config/db');

exports.getUsers = async (req, res) => {
  try {
    const users = await pool.query("SELECT id, name, email, role FROM users ORDER BY id");
    res.json(users.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching users' });
  }
};

// Check that the user actually existed before deleting
exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM users WHERE id=$1 RETURNING id", [id]);
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'User not found' });
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting user' });
  }
};