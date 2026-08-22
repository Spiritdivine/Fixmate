import { Router } from 'express';
import { JobController } from '../controllers/job.controller.js';
import { authenticate, requireRoles } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  createJobSchema,
  updateJobSchema,
  updateJobStatusSchema,
  inviteArtisanSchema,
  respondInvitationSchema,
  jobParamSchema,
  attachmentParamSchema,
} from '../validators/job.validator.js';

const router = Router();

// Public Discovery
router.get('/categories', JobController.listCategories);
router.get('/', JobController.list);

// Saved Jobs (Bookmarks)
router.get('/saved', authenticate, requireRoles('ARTISAN'), JobController.getSavedJobs);
router.post('/:id/save', authenticate, requireRoles('ARTISAN'), validate(jobParamSchema), JobController.saveJob);
router.delete('/:id/save', authenticate, requireRoles('ARTISAN'), validate(jobParamSchema), JobController.unsaveJob);

// Invitations
router.get('/invitations/my-invitations', authenticate, requireRoles('ARTISAN'), JobController.getMyInvitations);
router.post('/:id/invite/:artisanId', authenticate, requireRoles('CLIENT'), validate(inviteArtisanSchema), JobController.inviteArtisan);
router.patch('/invitations/:id/respond', authenticate, requireRoles('ARTISAN'), validate(respondInvitationSchema), JobController.respondInvitation);
router.delete('/invitations/:id', authenticate, requireRoles('CLIENT'), JobController.cancelInvitation);

// Client Specific
router.get('/my-jobs', authenticate, requireRoles('CLIENT', 'ADMIN'), JobController.getMyJobs);
router.post('/', authenticate, requireRoles('CLIENT', 'ADMIN'), validate(createJobSchema), JobController.create);

// Job Detail & Lifecycle
router.get('/:id', validate(jobParamSchema), JobController.getById);
router.put('/:id', authenticate, requireRoles('CLIENT', 'ADMIN'), validate(updateJobSchema), JobController.update);
router.patch('/:id', authenticate, requireRoles('CLIENT', 'ADMIN'), validate(updateJobSchema), JobController.update);
router.patch('/:id/status', authenticate, requireRoles('CLIENT', 'ADMIN'), validate(updateJobStatusSchema), JobController.updateStatus);
router.delete('/:id', authenticate, requireRoles('CLIENT', 'ADMIN'), validate(jobParamSchema), JobController.delete);
router.delete('/:id/attachments/:attachmentId', authenticate, requireRoles('CLIENT', 'ADMIN'), validate(attachmentParamSchema), JobController.deleteAttachment);

export default router;
