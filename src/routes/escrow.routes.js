import { Router } from 'express';
import { EscrowController } from '../controllers/escrow.controller.js';
import { authenticate, requireRoles } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  fundMilestoneSchema,
  submitWorkSchema,
  approveReleaseSchema,
  requestRevisionSchema,
  refundMilestoneSchema,
  syncOnChainSchema,
} from '../validators/escrow.validator.js';

const router = Router();

router.post(
  '/fund-milestone/:milestoneId',
  authenticate,
  requireRoles('CLIENT'),
  validate(fundMilestoneSchema),
  EscrowController.fundMilestone
);

router.post(
  '/submit-work/:milestoneId',
  authenticate,
  requireRoles('ARTISAN'),
  validate(submitWorkSchema),
  EscrowController.submitWork
);

router.patch(
  '/request-revision/:milestoneId',
  authenticate,
  requireRoles('CLIENT'),
  validate(requestRevisionSchema),
  EscrowController.requestRevision
);

router.post(
  '/approve-release/:milestoneId',
  authenticate,
  requireRoles('CLIENT'),
  validate(approveReleaseSchema),
  EscrowController.approveRelease
);

router.post(
  '/refund-milestone/:milestoneId',
  authenticate,
  requireRoles('ARTISAN'),
  validate(refundMilestoneSchema),
  EscrowController.refundMilestone
);
router.patch(
  '/refund-milestone/:milestoneId',
  authenticate,
  requireRoles('ARTISAN'),
  validate(refundMilestoneSchema),
  EscrowController.refundMilestone
);

router.post(
  '/sync-onchain/:contractId',
  authenticate,
  validate(syncOnChainSchema),
  EscrowController.syncOnChain
);

export default router;
