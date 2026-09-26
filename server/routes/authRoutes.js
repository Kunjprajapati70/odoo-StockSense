import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  forgotPassword,
  login,
  logout,
  me,
  resetPassword,
  signup,
  updatePassword,
  updateProfile,
  updateSettings,
  verifyOtp,
} from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Try again later.' },
});

router.post('/signup', authLimiter, signup);
router.post('/login', authLimiter, login);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/verify-otp', authLimiter, verifyOtp);
router.post('/reset-password', authLimiter, resetPassword);
router.post('/logout', requireAuth, logout);
router.get('/me', requireAuth, me);
router.put('/profile', requireAuth, updateProfile);
router.put('/password', requireAuth, updatePassword);
router.put('/settings', requireAuth, updateSettings);

export default router;
