// controllers/authController.js
const prisma  = require("../config/prisma");
const bcrypt  = require("bcrypt");
const jwt     = require("jsonwebtoken");
const crypto  = require("crypto");
const sendEmail = require("../utils/sendEmail");
const { sendVerificationEmail } = sendEmail;

const JWT_SECRET = process.env.JWT_SECRET || "secret";
if (!JWT_SECRET) throw new Error("FATAL: JWT_SECRET environment variable is not set. Server cannot start.");

function val(v) {
  return v != null && v !== "" ? v : null;
}

// ─────────────────────────────────────────
// 1. SIGNUP
// ─────────────────────────────────────────
exports.signup = async (req, res) => {
  const {
    name, email, password, phone,
    username, firstName, lastName, middleName, address,
  } = req.body;

  if (!firstName?.trim()) return res.status(400).json({ message: "First name is required" });
  if (!lastName?.trim())  return res.status(400).json({ message: "Last name is required" });
  if (!username?.trim())  return res.status(400).json({ message: "Username is required" });
  if (!email?.trim())     return res.status(400).json({ message: "Email is required" });
  if (!password?.trim())  return res.status(400).json({ message: "Password is required" });
  if (!phone?.trim())     return res.status(400).json({ message: "Phone number is required" });
  if (!address?.trim())   return res.status(400).json({ message: "Address is required" });

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verifyToken    = crypto.randomBytes(32).toString("hex");

    const newUser = await prisma.user.create({
      data: {
        name:        val(name),
        email,
        password:    hashedPassword,
        role:        "user",
        phone:       val(phone),
        username:    val(username),
        firstName:   val(firstName),
        lastName:    val(lastName),
        middleName:  val(middleName),
        address:     val(address),
        mqttTopic:   "placeholder",
        isVerified:  false,
        verifyToken,
      },
    });

    const mqttTopic = `Smart_Alert/user_${newUser.id}/door`;
    await prisma.user.update({
      where: { id: newUser.id },
      data:  { mqttTopic },
    });

    await prisma.settings.create({
      data: {
        alarmEnabled:  false,
        smsEnabled:    false,
        scheduleStart: "08:00",
        scheduleEnd:   "17:00",
        userId:        newUser.id,
      },
    });

    const displayName = val(firstName) || val(name) || email;
    await sendVerificationEmail(email, verifyToken, displayName);

    res.status(201).json({
      message: "Account created! Please check your email to verify your account.",
    });
  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({ message: "Server error during signup" });
  }
};

// ─────────────────────────────────────────
// 2. VERIFY EMAIL
// ─────────────────────────────────────────
exports.verifyEmail = async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ message: "Verification token is missing" });
  }

  try {
    const user = await prisma.user.findFirst({ where: { verifyToken: token } });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired verification link" });
    }

    if (user.isVerified) {
      return res.status(200).json({ message: "Email already verified. You can log in." });
    }

    await prisma.user.update({
      where: { id: user.id },
      data:  { isVerified: true, verifyToken: null },
    });

    res.status(200).json({ message: "Email verified successfully! You can now log in." });
  } catch (err) {
    console.error("Verify Email Error:", err);
    res.status(500).json({ message: "Server error during verification" });
  }
};

// ─────────────────────────────────────────
// 3. RESEND VERIFICATION EMAIL
// ─────────────────────────────────────────
exports.resendVerification = async (req, res) => {
  const { email } = req.body;

  if (!email?.trim()) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: "No account found with that email" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "This account is already verified" });
    }

    const verifyToken = crypto.randomBytes(32).toString("hex");
    await prisma.user.update({
      where: { id: user.id },
      data:  { verifyToken },
    });

    const displayName = val(user.firstName) || val(user.name) || email;
    await sendVerificationEmail(email, verifyToken, displayName);

    res.status(200).json({ message: "Verification email resent. Please check your inbox." });
  } catch (err) {
    console.error("Resend Verification Error:", err);
    res.status(500).json({ message: "Server error resending verification" });
  }
};

// ─────────────────────────────────────────
// 4. LOGIN
// ─────────────────────────────────────────
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.isActive) {
      return res.status(403).json({
        message: "Your account has been deactivated. Please contact an administrator.",
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        message: "Please verify your email before logging in.",
        unverified: true,
      });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    let mqttTopic = user.mqttTopic;
    if (!mqttTopic) {
      mqttTopic = `Smart_Alert/user_${user.id}/door`;
      await prisma.user.update({ where: { id: user.id }, data: { mqttTopic } });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message:    "Login successful",
      token,
      id:         user.id,
      role:       user.role,
      name:       user.name,
      email:      user.email,
      avatar:     val(user.avatar),
      mqttTopic,
      phone:      val(user.phone),
      username:   val(user.username),
      firstName:  val(user.firstName),
      lastName:   val(user.lastName),
      middleName: val(user.middleName),
      address:    val(user.address),
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server error during login" });
  }
};

// ─────────────────────────────────────────
// 5. GOOGLE LOGIN
// ─────────────────────────────────────────
exports.googleAuth = async (req, res) => {
  const { email, name, avatar } = req.body;
  try {
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name,
          email,
          password:    "google_sso_user",
          role:        "user",
          mqttTopic:   "placeholder",
          isVerified:  true,
          verifyToken: null,
        },
      });

      const mqttTopic = `Smart_Alert/user_${user.id}/door`;
      user = await prisma.user.update({ where: { id: user.id }, data: { mqttTopic } });

      await prisma.settings.create({
        data: {
          alarmEnabled:  false,
          smsEnabled:    false,
          scheduleStart: "08:00",
          scheduleEnd:   "17:00",
          userId:        user.id,
        },
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        message: "Your account has been deactivated. Please contact an administrator.",
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message:    "Google login successful",
      token,
      id:         user.id,
      role:       user.role,
      name:       user.name,
      email:      user.email,
      avatar:     val(avatar) || val(user.avatar),
      mqttTopic:  user.mqttTopic,
      phone:      val(user.phone),
      username:   val(user.username),
      firstName:  val(user.firstName),
      lastName:   val(user.lastName),
      middleName: val(user.middleName),
      address:    val(user.address),
    });
  } catch (err) {
    console.error("Google Auth Error:", err);
    res.status(500).json({ message: "Server error during Google Authentication" });
  }
};

// ─────────────────────────────────────────
// 6. UPDATE PROFILE
// ─────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  const {
    name, avatar, phone, username,
    firstName, lastName, middleName, address, email,
  } = req.body;
  const userId = req.user.id;

  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        name:       val(name),
        avatar:     val(avatar),
        phone:      val(phone),
        username:   val(username),
        firstName:  val(firstName),
        lastName:   val(lastName),
        middleName: val(middleName),
        address:    val(address),
        email,
      },
    });

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id:         updated.id,
        name:       updated.name,
        email:      updated.email,
        role:       updated.role,
        avatar:     val(updated.avatar),
        mqttTopic:  updated.mqttTopic,
        phone:      val(updated.phone),
        username:   val(updated.username),
        firstName:  val(updated.firstName),
        lastName:   val(updated.lastName),
        middleName: val(updated.middleName),
        address:    val(updated.address),
      },
    });
  } catch (err) {
    console.error("Update Profile Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────
// 7. FORGOT PASSWORD  ✅ FIXED
// ─────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  // ✅ FIX: Validate FRONTEND_URL first and return a proper error — never throw
  const frontendUrl = process.env.FRONTEND_URL;
  if (!frontendUrl) {
    console.error("FATAL: FRONTEND_URL environment variable is not set.");
    return res.status(500).json({ message: "Server configuration error. Please contact support." });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "No account found with that email address." });
    }

    const resetToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "10m" });

    // ✅ FIX: Use the CURRENT live frontend URL from env variable
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
    const message  = `You requested a password reset.\n\nClick the link below:\n\n${resetUrl}\n\nExpires in 10 minutes. Ignore if you did not request this.`;

    await sendEmail({ email: user.email, subject: "Password Reset Request", message });
    res.status(200).json({ message: "Reset link sent to email" });
  } catch (err) {
    console.error("Forgot Password Error:", err);
    res.status(500).json({ message: "Error sending reset email" });
  }
};

// ─────────────────────────────────────────
// 8. RESET PASSWORD  ✅ FIXED
// ─────────────────────────────────────────
exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  // ✅ FIX: Validate inputs before doing anything
  if (!token)       return res.status(400).json({ message: "Reset token is required." });
  if (!newPassword) return res.status(400).json({ message: "New password is required." });
  if (newPassword.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters." });

  try {
    const decoded        = jwt.verify(token, JWT_SECRET);
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: decoded.id },
      data:  { password: hashedPassword },
    });

    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Reset Password Error:", err);
    // ✅ FIX: Distinguish between expired token and other errors
    if (err.name === "TokenExpiredError") {
      return res.status(400).json({ message: "Reset link has expired. Please request a new one." });
    }
    res.status(400).json({ message: "Invalid or expired token" });
  }
};

// ─────────────────────────────────────────
// 9. GET PHONE NUMBER (for ESP32)
// ─────────────────────────────────────────
exports.getPhoneNumber = async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  try {
    const user = await prisma.user.findUnique({
      where:  { id: userId },
      select: { phone: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ phone: val(user.phone) });
  } catch (err) {
    console.error("Get Phone Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.createAdmin = async (req, res) => {
  const secret = req.headers["x-admin-secret"];
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ message: "Forbidden" });
  }

  try {
    const existingAdmin = await prisma.user.findFirst({ where: { role: "admin" } });
    if (existingAdmin) {
      return res.status(409).json({ message: "An admin account already exists." });
    }

    const { email, password, firstName, lastName, phone, address, username } = req.body;

    if (!email?.trim() || !password?.trim()) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await prisma.user.create({
      data: {
        name:       `${val(firstName) || ""} ${val(lastName) || ""}`.trim() || "Admin",
        email,
        password:   hashedPassword,
        role:       "admin",
        isVerified: true,
        isActive:   true,
        mqttTopic:  null,
        phone:      val(phone),
        username:   val(username),
        firstName:  val(firstName),
        lastName:   val(lastName),
        address:    val(address),
      },
    });

    res.status(201).json({
      message: "Admin account created successfully.",
      id:      admin.id,
      email:   admin.email,
    });
  } catch (err) {
    console.error("Create Admin Error:", err);
    res.status(500).json({ message: "Server error creating admin" });
  }
};