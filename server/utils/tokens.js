import jwt from 'jsonwebtoken';
import { ApiError } from './ApiError.js';

function secret() {
  const value = process.env.JWT_SECRET;
  if (!value) {
    throw new ApiError(500, 'JWT secret is not configured.');
  }
  return value;
}

export function signAccessToken(user) {
  return jwt.sign(
    { sub: String(user._id), role: user.role, purpose: 'access' },
    secret(),
    { expiresIn: '8h' },
  );
}

export function signResetToken(user) {
  return jwt.sign(
    { sub: String(user._id), purpose: 'password_reset' },
    secret(),
    { expiresIn: '15m' },
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, secret());
  } catch {
    throw new ApiError(401, 'Your session has expired. Please log in again.');
  }
}
