import { Router } from 'express';
import { LoyaltyController } from '../controllers/loyalty.controller.js';
import { authenticate, requireRoles } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  validateReferralCodeSchema,
  reservePointsSchema,
  directoryBoostSchema,
  ledgerQuerySchema,
} from '../validators/loyalty.validator.js';

const router = Router();

// Public referral code pre-validation (used in registration screen)
router.post(
  '/referral/validate',
  validate(validateReferralCodeSchema),
  LoyaltyController.validateCode
);

// Authenticated Loyalty & Referral Endpoints
router.get('/profile', authenticate, LoyaltyController.getProfile);
router.get('/ledger', authenticate, validate(ledgerQuerySchema), LoyaltyController.getLedger);
router.get('/leaderboard', authenticate, LoyaltyController.getLeaderboard);
router.get('/referrals/activity', authenticate, LoyaltyController.getReferralActivity);
router.post(
  '/referral/claim',
  authenticate,
  validate(validateReferralCodeSchema),
  LoyaltyController.claimReferralCode
);

// Redemption & Burn Channels
router.post(
  '/redeem/escrow-discount',
  authenticate,
  validate(reservePointsSchema),
  LoyaltyController.reserveDiscount
);

router.post(
  '/redeem/directory-boost',
  authenticate,
  requireRoles('ARTISAN'),
  validate(directoryBoostSchema),
  LoyaltyController.purchaseDirectoryBoost
);

export default router;
