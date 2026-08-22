import { Router } from 'express';
import { ProposalController } from '../controllers/proposal.controller.js';
import { authenticate, requireRoles } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  createProposalSchema,
  updateProposalSchema,
  updateProposalStatusSchema,
  proposalParamSchema,
} from '../validators/proposal.validator.js';

const router = Router();

router.post('/', authenticate, requireRoles('ARTISAN'), validate(createProposalSchema), ProposalController.submit);
router.get('/my-proposals', authenticate, requireRoles('ARTISAN'), ProposalController.getMyProposals);
router.get('/job/:jobId', authenticate, requireRoles('CLIENT'), ProposalController.getJobProposals);

router.get('/:id', authenticate, validate(proposalParamSchema), ProposalController.getById);
router.put('/:id', authenticate, requireRoles('ARTISAN'), validate(updateProposalSchema), ProposalController.update);
router.patch('/:id', authenticate, requireRoles('ARTISAN'), validate(updateProposalSchema), ProposalController.update);
router.patch('/:id/status', authenticate, requireRoles('CLIENT'), validate(updateProposalStatusSchema), ProposalController.updateStatus);
router.delete('/:id', authenticate, requireRoles('ARTISAN'), validate(proposalParamSchema), ProposalController.withdraw);

export default router;
