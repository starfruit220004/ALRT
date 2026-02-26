const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || "secret";

// SIGNUP
exports.signup = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userCheck = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      'INSERT INTO users(name, email, password, role) VALUES($1, $2, $3, $4)',
      [name, email, hashedPassword, 'user']
    );

    res.status(201).json({ message: 'Account created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// LOGIN
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'User not found' });

    const user = result.rows[0];

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ message: 'Incorrect password' });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    // ✅ also return name and avatar so frontend can display them
    res.json({
      message: 'Login successful',
      token,
      role: user.role,
      name: user.name,
      email: user.email,
      avatar: user.avatar || null,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// UPDATE PROFILE (name + avatar)
exports.updateProfile = async (req, res) => {
  const { name, avatar } = req.body;
  const userId = req.user.id; // comes from verifyToken middleware

  try {
    const result = await pool.query(
      'UPDATE users SET name=$1, avatar=$2 WHERE id=$3 RETURNING id, name, email, role, avatar',
      [name, avatar || null, userId]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: 'User not found' });

    const updated = result.rows[0];

    res.json({
      message: 'Profile updated successfully',
      user: {
        name:   updated.name,
        email:  updated.email,
        role:   updated.role,
        avatar: updated.avatar,
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'Email not found' });

    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '15m' });
    console.log(`🔑 Reset token for ${email}: ${token}`);
    res.json({ message: 'Reset token generated (check console)' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};