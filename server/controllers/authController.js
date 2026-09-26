import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ACCOUNT_STATUS, ROLES } from '../utils/constants.js';
import { storeDevOtp } from '../utils/devMailbox.js';
import { sendPasswordResetOtp } from '../utils/mailer.js';
import { publicUser } from '../utils/publicUser.js';
import { signAccessToken, signResetToken, verifyToken } from '../utils/tokens.js';

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const DUMMY_HASH = bcrypt.hashSync('invalid-login-placeholder', 8);

function assertPassword(password) {
  if (!PASSWORD_PATTERN.test(password || '')) {
    throw new ApiError(400, 'Password must be at least 8 characters and include upper, lower, and a number.');
  }
}

export const signup = asyncHandler(async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;
  if (!name?.trim() || !email?.trim() || !password) {
    throw new ApiError(400, 'Name, email, and password are required.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ApiError(400, 'Enter a valid email address.');
  }
  assertPassword(password);
  if (password !== confirmPassword) {
    throw new ApiError(400, 'Password confirmation does not match.');
  }
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw new ApiError(409, 'An account with this email already exists.');
  const user = await User.create({
    name: name.trim(),
    email,
    password,
    role: ROLES.STAFF,
    status: ACCOUNT_STATUS.ACTIVE,
  });
  const token = signAccessToken(user);
  res.status(201).json({
    success: true,
    message: 'Account created successfully.',
    data: { token, user: publicUser(user) },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, 'Email and password are required.');
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) {
    await bcrypt.compare(password, DUMMY_HASH);
    throw new ApiError(401, 'Invalid email or password.');
  }
  const matches = await user.comparePassword(password);
  if (!matches) throw new ApiError(401, 'Invalid email or password.');
  if (user.status === ACCOUNT_STATUS.UNVERIFIED) {
    throw new ApiError(403, 'This account is not verified.');
  }
  const token = signAccessToken(user);
  res.json({
    success: true,
    message: 'Logged in successfully.',
    data: { token, user: publicUser(user) },
  });
});

export const logout = asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Logged out successfully.' });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: publicUser(req.user) });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const name = req.body.name?.trim();
  if (!name || name.length < 2) throw new ApiError(400, 'Enter your full name.');
  req.user.name = name;
  await req.user.save();
  res.json({ success: true, message: 'Profile updated successfully.', data: publicUser(req.user) });
});

export const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  assertPassword(newPassword);
  if (newPassword !== confirmPassword) throw new ApiError(400, 'Password confirmation does not match.');
  const user = await User.findById(req.user._id).select('+password');
  const matches = await user.comparePassword(currentPassword || '');
  if (!matches) throw new ApiError(400, 'Current password is incorrect.');
  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: 'Password updated successfully.' });
});

export const updateSettings = asyncHandler(async (req, res) => {
  req.user.preferences = {
    emailAlerts: Boolean(req.body.emailAlerts),
    compactTables: Boolean(req.body.compactTables),
  };
  await req.user.save();
  res.json({ success: true, message: 'Settings saved.', data: publicUser(req.user) });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const email = req.body.email?.toLowerCase().trim();
  if (!email) throw new ApiError(400, 'Email is required.');
  const user = await User.findOne({ email }).select('+resetOtpHash +resetOtpExpires +resetOtpAttempts');
  if (user && user.status === ACCOUNT_STATUS.ACTIVE) {
    const otp = String(crypto.randomInt(100000, 1000000));
    user.resetOtpHash = await bcrypt.hash(otp, 10);
    user.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    user.resetOtpAttempts = 0;
    await user.save();
    try {
      const emailed = await sendPasswordResetOtp({ to: email, name: user.name, otp });
      if (emailed) {
        storeDevOtp(email, otp, { quiet: true });
        console.info(`Password reset email sent to ${email}`);
      } else if (process.env.NODE_ENV === 'production') {
        throw new ApiError(503, 'Email delivery is not configured.');
      } else {
        storeDevOtp(email, otp);
      }
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error(`Password reset email failed for ${email}: ${error.message}`);
      throw new ApiError(503, 'The verification email could not be sent. Try again in a moment.');
    }
  }
  res.json({
    success: true,
    message: 'If an account exists for that email, a verification code has been sent.',
  });
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const email = req.body.email?.toLowerCase().trim();
  const otp = String(req.body.otp || '').trim();
  const user = await User.findOne({ email }).select('+resetOtpHash +resetOtpExpires +resetOtpAttempts');
  if (!user || !user.resetOtpHash || !user.resetOtpExpires || user.resetOtpExpires < new Date()) {
    throw new ApiError(400, 'The verification code is invalid or has expired.');
  }
  if (user.resetOtpAttempts >= 5) {
    throw new ApiError(429, 'Too many incorrect attempts. Request a new code.');
  }
  const matches = await bcrypt.compare(otp, user.resetOtpHash);
  if (!matches) {
    user.resetOtpAttempts += 1;
    await user.save();
    throw new ApiError(400, 'The verification code is invalid or has expired.');
  }
  user.resetOtpHash = undefined;
  user.resetOtpExpires = undefined;
  user.resetOtpAttempts = 0;
  await user.save();
  res.json({
    success: true,
    message: 'Code verified.',
    data: { resetToken: signResetToken(user) },
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const payload = verifyToken(req.body.resetToken || '');
  if (payload.purpose !== 'password_reset') {
    throw new ApiError(401, 'The reset link is invalid or has expired.');
  }
  assertPassword(req.body.password);
  if (req.body.password !== req.body.confirmPassword) {
    throw new ApiError(400, 'Password confirmation does not match.');
  }
  const user = await User.findById(payload.sub).select('+password +resetOtpHash');
  if (!user) throw new ApiError(400, 'Account not found.');
  user.password = req.body.password;
  user.resetOtpHash = undefined;
  user.resetOtpExpires = undefined;
  user.resetOtpAttempts = 0;
  await user.save();
  res.json({ success: true, message: 'Password updated successfully.' });
});
