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
  resendOtpSchema,
  sendVerificationEmailSchema,
  verifyEmailQuerySchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  deleteAccountSchema,
  socialLoginSchema,
  switchRoleSchema,
  setPinSchema,
  changePinSchema,
  verifyPinSchema,
} from '../validators/auth.validator.js';

const router = Router();

router.post('/register', authRateLimiter, validate(registerSchema), AuthController.register);
router.post('/login', authRateLimiter, validate(loginSchema), AuthController.login);
router.post('/social-login', authRateLimiter, validate(socialLoginSchema), AuthController.socialLogin);
router.post('/refresh-token', validate(refreshTokenSchema), AuthController.refresh);
router.post('/logout', AuthController.logout);
router.post('/verify-otp', authRateLimiter, validate(otpSchema), AuthController.verifyOtp);
router.post('/resend-otp', authRateLimiter, validate(resendOtpSchema), AuthController.resendOtp);
router.get('/me', authenticate, AuthController.getMe);
router.delete('/me', authenticate, validate(deleteAccountSchema), AuthController.deleteAccount);

// Role Context Switching
router.post('/switch-role', authenticate, validate(switchRoleSchema), AuthController.switchRole);

// Security & Transaction PIN Management
router.post('/pin/set', authenticate, authRateLimiter, validate(setPinSchema), AuthController.setTransactionPin);
router.post('/pin/change', authenticate, authRateLimiter, validate(changePinSchema), AuthController.changeTransactionPin);
router.post('/pin/verify', authenticate, authRateLimiter, validate(verifyPinSchema), AuthController.verifyTransactionPin);

// Email Verification
router.post(
  '/send-verification-email',
  authRateLimiter,
  validate(sendVerificationEmailSchema),
  AuthController.sendVerificationEmail
);
router.get(
  '/verify-email',
  validate(verifyEmailQuerySchema),
  AuthController.verifyEmailToken
);

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



