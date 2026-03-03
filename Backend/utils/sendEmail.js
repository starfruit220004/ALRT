const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Create a transporter specifically for Gmail
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, 
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // This must be the 16-digit App Password
    },
  });

  // Test the connection to Google
  try {
    await transporter.verify();
  } catch (err) {
    console.error('❌ SMTP Verification Failed:', err.message);
    throw new Error('Email server authentication failed. Check your App Password.');
  }

  const mailOptions = {
    from: `"Smart_Alert System" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('📧 Reset email sent to:', options.email);
  } catch (error) {
    console.error('❌ SendMail Error:', error);
    throw new Error('The email service failed to deliver the message.');
  }
};

module.exports = sendEmail;