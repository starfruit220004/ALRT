const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || "secret";

// SIGNUP — auto-generates mqtt_topic after insert
exports.signup = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userCheck = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    if (userCheck.rows.length > 0)
      return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user first to get the ID
    const result = await pool.query(
      'INSERT INTO users(name, email, password, role) VALUES($1, $2, $3, $4) RETURNING id',
      [name, email, hashedPassword, 'user']
    );

    const newUserId = result.rows[0].id;

    // Auto-generate and save their unique MQTT topic based on their ID
    const mqttTopic = `Smart_Alert/user_${newUserId}/door`;
    await pool.query('UPDATE users SET mqtt_topic=$1 WHERE id=$2', [mqttTopic, newUserId]);

    res.status(201).json({ message: 'Account created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// LOGIN — returns id and mqtt_topic so frontend can store them
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'User not found' });

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ message: 'Incorrect password' });

    // Ensure mqtt_topic exists (for existing users before migration)
    if (!user.mqtt_topic) {
      const topic = `Smart_Alert/user_${user.id}/door`;
      await pool.query('UPDATE users SET mqtt_topic=$1 WHERE id=$2', [topic, user.id]);
      user.mqtt_topic = topic;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      message:    'Login successful',
      token,
      id:         user.id,
      role:       user.role,
      name:       user.name,
      email:      user.email,
      avatar:     user.avatar || null,
      mqttTopic:  user.mqtt_topic, // ← so user knows what to flash on their ESP32
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// UPDATE PROFILE
exports.updateProfile = async (req, res) => {
  const { name, avatar } = req.body;
  const userId = req.user.id;
  try {
    const result = await pool.query(
      'UPDATE users SET name=$1, avatar=$2 WHERE id=$3 RETURNING id, name, email, role, avatar, mqtt_topic',
      [name, avatar || null, userId]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'User not found' });

    const updated = result.rows[0];
    res.json({
      message: 'Profile updated successfully',
      user: {
        name:      updated.name,
        email:     updated.email,
        role:      updated.role,
        avatar:    updated.avatar,
        mqttTopic: updated.mqtt_topic,
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