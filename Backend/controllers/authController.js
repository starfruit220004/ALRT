const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// ─────────────────────────────────────────
// 1. SIGNUP
// ─────────────────────────────────────────
exports.signup = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0)
      return res.status(400).json({ message: 'Email already in use' });

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id',
      [name, email, hashedPassword, 'user']
    );

    const newUserId = result.rows[0].id;

    // Auto-generate unique MQTT topic
    const mqttTopic = `Smart_Alert/user_${newUserId}/door`;
    await pool.query('UPDATE users SET mqtt_topic = $1 WHERE id = $2', [mqttTopic, newUserId]);

    res.status(201).json({ message: 'Account created successfully!' });
  } catch (err) {
    console.error('Signup Error:', err);
    res.status(500).json({ message: 'Server error during signup' });
  }
};

// ─────────────────────────────────────────
// 2. LOGIN
// ─────────────────────────────────────────
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'User not found' });

    const user = result.rows[0];

    // Compare hashed password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid)
      return res.status(401).json({ message: 'Invalid credentials' });

    // Ensure mqtt_topic exists (for older users created before MQTT was added)
    if (!user.mqtt_topic) {
      const topic = `Smart_Alert/user_${user.id}/door`;
      await pool.query('UPDATE users SET mqtt_topic = $1 WHERE id = $2', [topic, user.id]);
      user.mqtt_topic = topic;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      message:   'Login successful',
      token,
      id:        user.id,
      role:      user.role,
      name:      user.name,
      email:     user.email,
      avatar:    user.avatar || null,
      mqttTopic: user.mqtt_topic,
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// ─────────────────────────────────────────
// 3. GOOGLE LOGIN
// ─────────────────────────────────────────
exports.googleAuth = async (req, res) => {
  const { email, name, avatar } = req.body;
  try {
    let userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    // If user doesn't exist, create one
    if (userResult.rows.length === 0) {
      const inserted = await pool.query(
        'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id',
        [name, email, 'google_sso_user', 'user']
      );

      const newUserId = inserted.rows[0].id;
      const mqttTopic = `Smart_Alert/user_${newUserId}/door`;
      await pool.query('UPDATE users SET mqtt_topic = $1 WHERE id = $2', [mqttTopic, newUserId]);

      // Re-fetch the full user row
      userResult = await pool.query('SELECT * FROM users WHERE id = $1', [newUserId]);
    }

    const user = userResult.rows[0];

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      message:   'Google login successful',
      token,
      id:        user.id,
      role:      user.role,
      name:      user.name,
      email:     user.email,
      avatar:    avatar || user.avatar || null,
      mqttTopic: user.mqtt_topic,
    });
  } catch (err) {
    console.error('Google Auth Error:', err);
    res.status(500).json({ message: 'Server error during Google Authentication' });
  }
};

// ─────────────────────────────────────────
// 4. UPDATE PROFILE
// ─────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  const { name, avatar } = req.body;
  const userId = req.user.id;
  try {
    const result = await pool.query(
      'UPDATE users SET name = $1, avatar = $2 WHERE id = $3 RETURNING id, name, email, role, avatar, mqtt_topic',
      [name, avatar || null, userId]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'User not found' });

    const updated = result.rows[0];
    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id:        updated.id,
        name:      updated.name,
        email:     updated.email,
        role:      updated.role,
        avatar:    updated.avatar,
        mqttTopic: updated.mqtt_topic,
      },
    });
  } catch (err) {
    console.error('Update Profile Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────
// 5. FORGOT PASSWORD
// ─────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'User not found' });

    const user = result.rows[0];

    // Token valid for 10 minutes
    const resetToken = jwt.sign(
      { id: user.id },
      JWT_SECRET,
      { expiresIn: '10m' }
    );

    const resetUrl = `http://localhost:5173/reset-password?token=${resetToken}`;
    const message = `You requested a password reset. Please click the link below to reset your password:\n\n${resetUrl}\n\nThis link expires in 10 minutes.\n\nIf you did not request this, please ignore this email.`;

    await sendEmail({
      email:   user.email,
      subject: 'Password Reset Request',
      message,
    });

    res.status(200).json({ message: 'Reset link sent to email' });
  } catch (err) {
    console.error('Forgot Password Error:', err);
    res.status(500).json({ message: 'Error sending reset email' });
  }
};

// ─────────────────────────────────────────
// 6. RESET PASSWORD
// ─────────────────────────────────────────
exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Hash the new password before saving
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, decoded.id]);

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Reset Password Error:', err);
    res.status(400).json({ message: 'Invalid or expired token' });
  }
};