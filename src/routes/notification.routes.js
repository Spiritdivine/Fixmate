import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { notificationParamSchema, notificationQuerySchema } from '../validators/notification.validator.js';

const router = Router();

router.get('/', authenticate, validate(notificationQuerySchema), NotificationController.getNotifications);
router.patch('/read-all', authenticate, NotificationController.markAllAsRead);
router.patch('/:id/read', authenticate, validate(notificationParamSchema), NotificationController.markAsRead);
router.delete('/:id', authenticate, validate(notificationParamSchema), NotificationController.deleteNotification);
router.delete('/', authenticate, NotificationController.clearRead);

export default router;
