const pool = require('../config/db');

// GET USERS
exports.getUsers = async (req, res) => {
  const users = await pool.query("SELECT id, name, email, role FROM users");
  res.json(users.rows);
};

// DELETE USER
exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  await pool.query("DELETE FROM users WHERE id=$1", [id]);
  res.json({ message: "Deleted" });
};