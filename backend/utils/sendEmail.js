const nodemailer = require('nodemailer');
const logger = require('./logger');

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const message = {
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to,
      subject,
      text,
      html
    };

    const info = await transporter.sendMail(message);
    logger.info(`Email sent: ${info.messageId} to ${to}`);
    return info;
  } catch (error) {
    logger.error(`Email failed: ${error.message}`);
    throw new Error('Email could not be sent');
  }
};

const passwordResetTemplate = (name, resetUrl) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Password Reset</title></head>
<body style="font-family: Arial, sans-serif; background: #F5F5F5; padding: 20px;">
  <div style="max-width: 500px; margin: 0 auto; background: #fff; border: 3px solid #111827; padding: 30px;">
    <h1 style="font-size: 28px; font-weight: 900; color: #111827; border-bottom: 3px solid #111827; padding-bottom: 15px;">
      InventoryPro
    </h1>
    <h2 style="color: #111827;">Password Reset Request</h2>
    <p style="color: #374151;">Hello ${name},</p>
    <p style="color: #374151;">You requested a password reset. Click the button below to reset your password. This link expires in 10 minutes.</p>
    <a href="${resetUrl}" style="display: inline-block; background: #111827; color: #fff; padding: 14px 28px; font-weight: 700; text-decoration: none; margin: 20px 0; border: 3px solid #111827;">
      RESET PASSWORD
    </a>
    <p style="color: #374151; font-size: 12px;">If you did not request this, please ignore this email.</p>
    <p style="color: #374151; font-size: 12px; word-break: break-all;">Or copy this link: ${resetUrl}</p>
  </div>
</body>
</html>`;

module.exports = { sendEmail, passwordResetTemplate };
