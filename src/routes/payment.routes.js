import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { requirePaystackIp } from '../middlewares/webhook.middleware.js';
import { financialRateLimiter } from '../config/rate-limiter.js';
import { initializeDepositSchema } from '../validators/payment.validator.js';

const router = Router();

// Paystack deposit initialization & verification
router.post('/initialize', authenticate, financialRateLimiter, validate(initializeDepositSchema), PaymentController.initializeDeposit);
router.get('/verify/:reference', authenticate, PaymentController.verifyDeposit);

// Live Exchange Rates (e.g. USDC -> NGN)
router.get('/rates', authenticate, PaymentController.getExchangeRate);

// Kotani Pay Crypto On-Ramp & Off-Ramp
router.post('/kotani/on-ramp', authenticate, financialRateLimiter, PaymentController.initiateKotaniOnRamp);
router.post('/kotani/off-ramp', authenticate, financialRateLimiter, PaymentController.initiateKotaniOffRamp);

// Webhook listeners (Open public routes verified with respective HMAC signatures and IP whitelist)
router.post('/webhook', requirePaystackIp, PaymentController.handleWebhook);
router.post('/webhooks/kotani', PaymentController.handleKotaniWebhook);

export default router;
