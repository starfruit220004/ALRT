// const pool = require('../config/db');
// const jwt = require('jsonwebtoken');
// const sendEmail = require('../utils/sendEmail');

// // --- Existing signup and login functions ---
// exports.signup = async (req, res) => {
//     // your existing signup code
// };

// exports.login = async (req, res) => {
//     // your existing login code
// };

// // --- Forgot Password Logic ---
// exports.forgotPassword = async (req, res) => {
//   const { email } = req.body;

//   try {
//     const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

//     if (user.rows.length === 0) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // Create a temporary token valid for 10 minutes
//     const resetToken = jwt.sign(
//         { id: user.rows[0].id }, 
//         process.env.JWT_SECRET, 
//         { expiresIn: '10m' }
//     );
    
//     // This link matches the route defined in your App.jsx
//     const resetUrl = `http://localhost:5173/reset-password?token=${resetToken}`;

//     const message = `You requested a password reset. Please click the link below to reset your password:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email.`;

//     await sendEmail({
//       email: user.rows[0].email,
//       subject: 'Password Reset Request',
//       message: message,
//     });

//     res.status(200).json({ message: "Reset link sent to email" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Error sending reset email" });
//   }
// };

// // --- Reset Password Logic ---
// exports.resetPassword = async (req, res) => {
//   const { token, newPassword } = req.body;

//   try {
//     // Verify the token sent from the frontend
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
//     // Update the user's password in the database
//     await pool.query("UPDATE users SET password = $1 WHERE id = $2", [newPassword, decoded.id]);

//     res.status(200).json({ message: "Password updated successfully" });
//   } catch (err) {
//     res.status(400).json({ message: "Invalid or expired token" });
//   }
// };

const pool = require('../config/db');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');

// --- 1. SIGNUP LOGIC ---
exports.signup = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if the email is already registered
    const userExist = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userExist.rows.length > 0) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // Save the new user to the database
    await pool.query(
      "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, 'user') RETURNING *",
      [name, email, password]
    );

    res.status(201).json({ message: "Account created successfully!" });
  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({ message: "Server error during signup" });
  }
};

// --- 2. LOGIN LOGIC ---
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    if (user.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.rows[0].password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.rows[0].id, role: user.rows[0].role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Send data back to frontend
    res.status(200).json({
      token: token,
      role: user.rows[0].role,
      name: user.rows[0].name,
      email: user.rows[0].email,
      avatar: user.rows[0].avatar
    });

  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server error during login" });
  }
};

// --- 3. GOOGLE LOGIN LOGIC ---
exports.googleAuth = async (req, res) => {
  const { email, name, avatar } = req.body;

  try {
    let user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    if (user.rows.length === 0) {
      const result = await pool.query(
        "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, 'user') RETURNING *",
        [name, email, 'google_sso_user'] 
      );
      user = result;
    }

    const token = jwt.sign(
      { id: user.rows[0].id, role: user.rows[0].role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      token: token,
      role: user.rows[0].role,
      name: user.rows[0].name,
      email: user.rows[0].email,
      avatar: avatar
    });

  } catch (err) {
    console.error("Google Auth Error:", err);
    res.status(500).json({ message: "Server error during Google Authentication" });
  }
};

// --- 4. FORGOT PASSWORD LOGIC ---
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    if (user.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const resetToken = jwt.sign(
        { id: user.rows[0].id }, 
        process.env.JWT_SECRET, 
        { expiresIn: '10m' }
    );
    
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

// --- 5. RESET PASSWORD LOGIC ---
exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    await pool.query("UPDATE users SET password = $1 WHERE id = $2", [newPassword, decoded.id]);
    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(400).json({ message: "Invalid or expired token" });
  }
};