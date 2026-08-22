import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authRateLimiter } from '../config/rate-limiter.js';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  otpSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators/auth.validator.js';

const router = Router();

router.post('/register', authRateLimiter, validate(registerSchema), AuthController.register);
router.post('/login', authRateLimiter, validate(loginSchema), AuthController.login);
router.post('/refresh-token', validate(refreshTokenSchema), AuthController.refresh);
router.post('/logout', AuthController.logout);
router.post('/verify-otp', authRateLimiter, validate(otpSchema), AuthController.verifyOtp);
router.get('/me', authenticate, AuthController.getMe);

// Password Management
router.patch('/change-password', authenticate, validate(changePasswordSchema), AuthController.changePassword);
router.put('/change-password', authenticate, validate(changePasswordSchema), AuthController.changePassword);
router.post('/forgot-password', authRateLimiter, validate(forgotPasswordSchema), AuthController.forgotPassword);
router.post('/reset-password', authRateLimiter, validate(resetPasswordSchema), AuthController.resetPassword);

// Session Management
router.get('/sessions', authenticate, AuthController.getSessions);
router.delete('/sessions/:id', authenticate, AuthController.revokeSession);
router.delete('/sessions', authenticate, AuthController.revokeOtherSessions);

export default router;

