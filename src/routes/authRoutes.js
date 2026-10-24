import { Router } from 'express';
import * as c from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import upload from '../middleware/upload.js';

const router = Router();

// Public
router.post('/signup', authLimiter, c.signup);
router.post('/login', authLimiter, c.login);
router.get('/verify-email/:token', c.verifyEmail);
router.post('/forgot-password', authLimiter, c.forgotPassword);
router.post('/reset-password/:token', authLimiter, c.resetPassword);

// Protected
router.use(protect);
router.post('/logout', c.logout);
router.post('/resend-verification', c.resendVerification);
router.put('/change-password', c.changePassword);
router.get('/me', c.getMe);
router.get('/me/qr', c.getMyQR);
router.put('/avatar', upload.single('avatar'), c.uploadAvatar);

export default router;
