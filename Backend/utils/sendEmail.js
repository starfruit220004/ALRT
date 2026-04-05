// utils/sendEmail.js
const nodemailer = require("nodemailer");

// 1. Initialize Transporter with robust settings from Version 2
const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // Use SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // 16-digit App Password
  },
});

// 2. Immediate Verification Check
const verifyConnection = async () => {
  try {
    await transporter.verify();
    console.log("✅ SMTP Server is ready to take our messages");
  } catch (err) {
    console.error("❌ SMTP Verification Failed:", err.message);
  }
};
verifyConnection();

/**
 * Combined Email Logic
 * @param {Object} options - { email, subject, message, html, userName }
 */
const sendEmail = async (options) => {
  const { email, subject, message, html, userName, verifyToken } = options;

  // Determine if we are sending a Verification Template or a Generic Email
  let emailContent = html;
  
  // If a verifyToken is provided, we automatically generate the HTML template
  if (verifyToken) {
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verifyToken}`;
    emailContent = `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;border:1px solid #e2e8f0;border-radius:12px;">
        <h2 style="color:#0f172a;margin-bottom:8px;">Welcome, ${userName || 'User'}!</h2>
        <p style="color:#475569;font-size:14px;line-height:1.6;">
          Thanks for signing up for Smart Alert. Please verify your email address to activate your account.
        </p>
        <a href="${verifyUrl}" style="display:inline-block;margin:24px 0;padding:12px 28px;background:#1d4ed8;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">
          Verify Email Address
        </a>
        <p style="color:#94a3b8;font-size:12px;">Link expires in 24 hours.</p>
        <p style="color:#94a3b8;font-size:12px;word-break:break-all;">Link: ${verifyUrl}</p>
      </div>
    `;
  }

  const mailOptions = {
    from: `"Smart Alert System" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: subject,
    text: message,      // Plain text fallback
    html: emailContent, // HTML content (if applicable)
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("📧 Email sent successfully:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ SendMail Error:", error);
    throw new Error("The email service failed to deliver the message.");
  }
};

const sendVerificationEmail = (email, verifyToken, displayName) =>
  sendEmail({
    email,
    subject: "Verify your Smart Alert email",
    userName: displayName,
    verifyToken,
  });

module.exports = sendEmail;
module.exports.sendVerificationEmail = sendVerificationEmail;