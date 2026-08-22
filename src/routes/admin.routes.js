import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import { authenticate, requireRoles } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  createCategorySchema,
  updateCategorySchema,
  createSkillSchema,
  updateSkillSchema,
  updateUserStatusSchema,
  updateSystemSettingSchema,
} from '../validators/admin.validator.js';

const router = Router();

// Guard all admin routes with authentication and ADMIN / SUPPORT roles
router.use(authenticate, requireRoles('ADMIN', 'SUPPORT'));

// Categories
router.post('/categories', validate(createCategorySchema), AdminController.createCategory);
router.put('/categories/:id', validate(updateCategorySchema), AdminController.updateCategory);
router.patch('/categories/:id', validate(updateCategorySchema), AdminController.updateCategory);
router.delete('/categories/:id', AdminController.deleteCategory);

// Skills
router.post('/skills', validate(createSkillSchema), AdminController.createSkill);
router.put('/skills/:id', validate(updateSkillSchema), AdminController.updateSkill);
router.patch('/skills/:id', validate(updateSkillSchema), AdminController.updateSkill);
router.delete('/skills/:id', AdminController.deleteSkill);

// User Moderation
router.patch('/users/:id/status', requireRoles('ADMIN'), validate(updateUserStatusSchema), AdminController.updateUserStatus);

// Audit Trail
router.get('/audit-logs', requireRoles('ADMIN'), AdminController.getAuditLogs);

// System Settings
router.get('/settings', requireRoles('ADMIN'), AdminController.getSettings);
router.put('/settings/:key', requireRoles('ADMIN'), validate(updateSystemSettingSchema), AdminController.updateSetting);
router.patch('/settings/:key', requireRoles('ADMIN'), validate(updateSystemSettingSchema), AdminController.updateSetting);

export default router;
