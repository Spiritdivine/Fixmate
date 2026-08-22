import { Router } from 'express';
import { DisputeController } from '../controllers/dispute.controller.js';
import { authenticate, requireRoles } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  fileDisputeSchema,
  resolveDisputeSchema,
  addEvidenceSchema,
  sendDisputeMessageSchema,
  disputeParamSchema,
  evidenceParamSchema,
} from '../validators/dispute.validator.js';

const router = Router();

// File & List Disputes
router.post('/', authenticate, validate(fileDisputeSchema), DisputeController.file);
router.get('/contract/:contractId', authenticate, DisputeController.getForContract);

// Dispute Cancellation
router.patch('/:id/cancel', authenticate, validate(disputeParamSchema), DisputeController.cancel);
router.delete('/:id', authenticate, validate(disputeParamSchema), DisputeController.cancel);

// Messages inside Dispute
router.get('/:id/messages', authenticate, validate(disputeParamSchema), DisputeController.getMessages);
router.post('/:id/messages', authenticate, validate(sendDisputeMessageSchema), DisputeController.sendMessage);

// Supplementary Evidence
router.post('/:id/evidence', authenticate, validate(addEvidenceSchema), DisputeController.addEvidence);
router.delete('/evidence/:evidenceId', authenticate, validate(evidenceParamSchema), DisputeController.deleteEvidence);

// Admin Arbitration
router.patch('/:id/resolve', authenticate, requireRoles('ADMIN', 'SUPPORT'), validate(resolveDisputeSchema), DisputeController.resolve);

export default router;
