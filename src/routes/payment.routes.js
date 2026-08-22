import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { financialRateLimiter } from '../config/rate-limiter.js';
import { initializeDepositSchema } from '../validators/payment.validator.js';

const router = Router();

// Paystack deposit initialization & verification
router.post('/initialize', authenticate, financialRateLimiter, validate(initializeDepositSchema), PaymentController.initializeDeposit);
router.get('/verify/:reference', authenticate, PaymentController.verifyDeposit);

// Webhook listener (Open public route verified with x-paystack-signature HMAC)
router.post('/webhook', PaymentController.handleWebhook);

export default router;
