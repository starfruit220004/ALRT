const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// helper: return null for empty/null/undefined, else the value
function val(v) {
  return v != null && v !== '' ? v : null;
}

// ─────────────────────────────────────────
// 1. SIGNUP
// ─────────────────────────────────────────
exports.signup = async (req, res) => {
  const { name, email, password, phone, username, firstName, lastName, middleName, address } = req.body;

  if (!firstName?.trim()) return res.status(400).json({ message: 'First name is required' });
  if (!lastName?.trim())  return res.status(400).json({ message: 'Last name is required' });
  if (!username?.trim())  return res.status(400).json({ message: 'Username is required' });
  if (!email?.trim())     return res.status(400).json({ message: 'Email is required' });
  if (!password?.trim())  return res.status(400).json({ message: 'Password is required' });
  if (!phone?.trim())     return res.status(400).json({ message: 'Phone number is required' });
  if (!address?.trim())   return res.status(400).json({ message: 'Address is required' });

  try {
    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0)
      return res.status(400).json({ message: 'Email already in use' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (name, email, password, role, phone, username, first_name, last_name, middle_name, address) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id',
      [name, email, hashedPassword, 'user',
       val(phone), val(username), val(firstName), val(lastName), val(middleName), val(address)]
    );

    const newUserId = result.rows[0].id;

    const mqttTopic = `Smart_Alert/user_${newUserId}/door`;
    await pool.query('UPDATE users SET mqtt_topic = $1 WHERE id = $2', [mqttTopic, newUserId]);

    await pool.query(
      'INSERT INTO settings (alarm_enabled, sms_enabled, user_id) VALUES ($1, $2, $3)',
      [false, false, newUserId]
    );

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

    // ── Block deactivated accounts ─────────────────────────────────────────
    if (!user.is_active) {
      return res.status(403).json({
        message: 'Your account has been deactivated. Please contact an administrator.'
      });
    }
    // ──────────────────────────────────────────────────────────────────────

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid)
      return res.status(401).json({ message: 'Invalid credentials' });

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
      message:    'Login successful',
      token,
      id:         user.id,
      role:       user.role,
      name:       user.name,
      email:      user.email,
      avatar:     val(user.avatar),
      mqttTopic:  user.mqtt_topic,
      phone:      val(user.phone),
      username:   val(user.username),
      firstName:  val(user.first_name),
      lastName:   val(user.last_name),
      middleName: val(user.middle_name),
      address:    val(user.address),
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

    if (userResult.rows.length === 0) {
      // Brand-new Google user — create account
      const inserted = await pool.query(
        'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id',
        [name, email, 'google_sso_user', 'user']
      );

      const newUserId = inserted.rows[0].id;
      const mqttTopic = `Smart_Alert/user_${newUserId}/door`;
      await pool.query('UPDATE users SET mqtt_topic = $1 WHERE id = $2', [mqttTopic, newUserId]);

      await pool.query(
        'INSERT INTO settings (alarm_enabled, sms_enabled, user_id) VALUES ($1, $2, $3)',
        [false, false, newUserId]
      );

      userResult = await pool.query('SELECT * FROM users WHERE id = $1', [newUserId]);
    }

    const user = userResult.rows[0];

    // ── Block deactivated accounts ─────────────────────────────────────────
    // Checked after creation so a brand-new Google account is never blocked,
    // but an existing deactivated Google account cannot log back in.
    if (!user.is_active) {
      return res.status(403).json({
        message: 'Your account has been deactivated. Please contact an administrator.'
      });
    }
    // ──────────────────────────────────────────────────────────────────────

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      message:    'Google login successful',
      token,
      id:         user.id,
      role:       user.role,
      name:       user.name,
      email:      user.email,
      avatar:     val(avatar) || val(user.avatar),
      mqttTopic:  user.mqtt_topic,
      phone:      val(user.phone),
      username:   val(user.username),
      firstName:  val(user.first_name),
      lastName:   val(user.last_name),
      middleName: val(user.middle_name),
      address:    val(user.address),
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
  const { name, avatar, phone, username, firstName, lastName, middleName, address, email } = req.body;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `UPDATE users
       SET name        = $1,
           avatar      = $2,
           phone       = $3,
           username    = $4,
           first_name  = $5,
           last_name   = $6,
           middle_name = $7,
           address     = $8,
           email       = $9
       WHERE id = $10
       RETURNING id, name, email, role, avatar, mqtt_topic,
                 phone, username, first_name, last_name, middle_name, address`,
      [
        val(name),
        val(avatar),
        val(phone),
        val(username),
        val(firstName),
        val(lastName),
        val(middleName),
        val(address),
        email,
        userId,
      ]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: 'User not found' });

    const u = result.rows[0];
    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id:         u.id,
        name:       u.name,
        email:      u.email,
        role:       u.role,
        avatar:     val(u.avatar),
        mqttTopic:  u.mqtt_topic,
        phone:      val(u.phone),
        username:   val(u.username),
        firstName:  val(u.first_name),
        lastName:   val(u.last_name),
        middleName: val(u.middle_name),
        address:    val(u.address),
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
    const resetToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '10m' });
    const resetUrl   = `http://localhost:5173/reset-password?token=${resetToken}`;
    const message    = `You requested a password reset. Please click the link below to reset your password:\n\n${resetUrl}\n\nThis link expires in 10 minutes.\n\nIf you did not request this, please ignore this email.`;

    await sendEmail({ email: user.email, subject: 'Password Reset Request', message });
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
    const decoded        = jwt.verify(token, JWT_SECRET);
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, decoded.id]);
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Reset Password Error:', err);
    res.status(400).json({ message: 'Invalid or expired token' });
  }
};

// ─────────────────────────────────────────
// 7. GET PHONE NUMBER (for ESP32)
// ─────────────────────────────────────────
exports.getPhoneNumber = async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query('SELECT phone FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'User not found' });
    res.status(200).json({ phone: val(result.rows[0].phone) });
  } catch (err) {
    console.error('Get Phone Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};