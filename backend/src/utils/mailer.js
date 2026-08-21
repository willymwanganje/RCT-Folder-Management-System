const nodemailer = require("nodemailer");
const { env } = require("../config/env");

function getTransport() {
  if (!env.smtp.host || !env.smtp.user) return null;
  return nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465,
    auth: { user: env.smtp.user, pass: env.smtp.pass },
  });
}

async function sendPasswordResetEmail(to, resetUrl) {
  const transport = getTransport();
  const subject = "RCT Folder Management — password reset";
  const text = `A password reset was requested for your RCT account.\n\nReset link (valid for 1 hour):\n${resetUrl}\n\nIf you did not request this, ignore this email.`;

  if (!transport) {
    console.info(`[mail] SMTP not configured. Password reset for ${to}: ${resetUrl}`);
    return { delivered: false, resetUrl };
  }

  await transport.sendMail({
    from: env.smtp.from,
    to,
    subject,
    text,
  });
  return { delivered: true };
}

module.exports = { sendPasswordResetEmail };
