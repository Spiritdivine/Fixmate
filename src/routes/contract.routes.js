import { Router } from 'express';
import { ContractController } from '../controllers/contract.controller.js';
import { authenticate, requireRoles } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  acceptProposalSchema,
  getContractSchema,
  updateMilestoneScheduleSchema,
  milestoneParamSchema,
} from '../validators/contract.validator.js';

const router = Router();

router.get('/', authenticate, ContractController.getMyContracts);
router.get('/:id', authenticate, validate(getContractSchema), ContractController.getById);

router.post(
  '/accept-proposal/:proposalId',
  authenticate,
  requireRoles('CLIENT'),
  validate(acceptProposalSchema),
  ContractController.acceptProposal
);

// Milestone Schedule Amendments
router.patch(
  '/:id/milestones/:milestoneId',
  authenticate,
  requireRoles('CLIENT'),
  validate(updateMilestoneScheduleSchema),
  ContractController.updateMilestone
);
router.delete(
  '/:id/milestones/:milestoneId',
  authenticate,
  requireRoles('CLIENT'),
  validate(milestoneParamSchema),
  ContractController.deleteMilestone
);

// Contract Cancellation
router.delete('/:id/cancel', authenticate, validate(getContractSchema), ContractController.cancelContract);
router.patch('/:id/cancel', authenticate, validate(getContractSchema), ContractController.cancelContract);

export default router;
