const pool = require('../config/db');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');

// --- Keep your existing signup and login functions ---
exports.signup = async (req, res) => {
    // your existing signup code
};

exports.login = async (req, res) => {
    // your existing login code
};

// --- Added Forgot Password Logic ---
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    if (user.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Create a temporary token valid for 10 minutes
    const resetToken = jwt.sign(
        { id: user.rows[0].id }, 
        process.env.JWT_SECRET, 
        { expiresIn: '10m' }
    );
    
    // This link matches the route defined in your App.jsx
    const resetUrl = `http://localhost:5173/reset-password?token=${resetToken}`;

    const message = `You requested a password reset. Please click the link below to reset your password:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email.`;

    await sendEmail({
      email: user.rows[0].email,
      subject: 'Password Reset Request',
      message: message,
    });

    res.status(200).json({ message: "Reset link sent to email" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error sending reset email" });
  }
};

// --- Added Reset Password Logic ---
exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    // Verify the token sent from the frontend
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Update the user's password in the database
    await pool.query("UPDATE users SET password = $1 WHERE id = $2", [newPassword, decoded.id]);

    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(400).json({ message: "Invalid or expired token" });
  }
};