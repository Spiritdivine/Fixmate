import { Router } from 'express';
import { ReviewController } from '../controllers/review.controller.js';
import { authenticate, requireRoles } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  createReviewSchema,
  updateReviewSchema,
  replyReviewSchema,
  reviewParamSchema,
} from '../validators/review.validator.js';

const router = Router();

// Public Reviews
router.get('/artisan/:artisanUserId', ReviewController.getArtisanReviews);

// Authenticated Reviews
router.post('/', authenticate, validate(createReviewSchema), ReviewController.create);
router.put('/:id', authenticate, validate(updateReviewSchema), ReviewController.update);
router.patch('/:id', authenticate, validate(updateReviewSchema), ReviewController.update);
router.delete('/:id', authenticate, validate(reviewParamSchema), ReviewController.delete);

// Artisan Reply
router.post('/:reviewId/reply', authenticate, requireRoles('ARTISAN'), validate(replyReviewSchema), ReviewController.reply);
router.patch('/:reviewId/reply', authenticate, requireRoles('ARTISAN'), validate(replyReviewSchema), ReviewController.reply);

export default router;
