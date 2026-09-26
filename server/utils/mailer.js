import nodemailer from 'nodemailer';

let transporter;

function smtpConfig() {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  if (!host || !user || !pass) return null;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465;
  return {
    host,
    port,
    secure,
    auth: { user, pass },
  };
}

function getTransporter() {
  if (!transporter) transporter = nodemailer.createTransport(smtpConfig());
  return transporter;
}

export function isMailConfigured() {
  return Boolean(smtpConfig());
}

export async function verifyMailer() {
  const config = smtpConfig();
  if (!config) {
    console.info('SMTP is not configured. Password reset codes are printed in this log until SMTP_HOST, SMTP_USER, and SMTP_PASS are set.');
    return;
  }
  try {
    await getTransporter().verify();
    console.info(`SMTP mail is ready (${config.host}).`);
  } catch (error) {
    console.error(`SMTP mail could not connect: ${error.message}`);
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}

export async function sendPasswordResetOtp({ to, name, otp }) {
  if (!isMailConfigured()) return false;
  const from = process.env.MAIL_FROM?.trim() || `StockSense <${process.env.SMTP_USER.trim()}>`;
  const greeting = name?.trim() || 'there';
  const safeGreeting = escapeHtml(greeting);
  const safeOtp = escapeHtml(otp);
  await getTransporter().sendMail({
    from,
    to,
    subject: 'Your StockSense password reset code',
    text: `Hello ${greeting},\n\nYour password reset code is ${otp}.\nIt expires in 10 minutes.\n\nIf you did not request this, you can ignore this email.\n`,
    html: `
      <div style="font-family:Segoe UI,Arial,sans-serif;color:#1a1d21;line-height:1.5">
        <p>Hello ${safeGreeting},</p>
        <p>Your password reset code is</p>
        <p style="font-size:28px;font-weight:700;letter-spacing:6px;margin:16px 0">${safeOtp}</p>
        <p>It expires in 10 minutes. If you did not request this, you can ignore this email.</p>
      </div>
    `,
  });
  return true;
}
