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
  manuallyVerifyUserSchema,
  updateSystemSettingSchema,
} from '../validators/admin.validator.js';

const router = Router();

// Guard all admin routes with authentication and ADMIN / SUPPORT roles
router.use(authenticate, requireRoles('ADMIN', 'SUPPORT'));

// Analytics & Overview
router.get('/analytics/overview', AdminController.getAnalyticsOverview);

// User Management & Moderation
router.get('/users', AdminController.getUsers);
router.get('/users/:id', AdminController.getUserById);
router.patch('/users/:id/status', requireRoles('ADMIN'), validate(updateUserStatusSchema), AdminController.updateUserStatus);
router.patch('/users/:id/verify', requireRoles('ADMIN', 'SUPPORT'), validate(manuallyVerifyUserSchema), AdminController.manuallyVerifyUser);

// KYC Verification Queue
router.get('/kyc', AdminController.getKycSubmissions);

// Disputes Arbitration Center
router.get('/disputes', AdminController.getDisputes);
router.get('/disputes/:id', AdminController.getDisputeById);

// Contracts & Escrow Oversight
router.get('/contracts', AdminController.getContracts);
router.get('/contracts/:id', AdminController.getContractById);

// Financial Ledger & Transactions
router.get('/transactions', requireRoles('ADMIN'), AdminController.getTransactions);

// Artisan Payout Requests
router.get('/payouts', requireRoles('ADMIN'), AdminController.getPayouts);
router.patch('/payouts/:id/status', requireRoles('ADMIN'), AdminController.updatePayoutStatus);

// Reviews & Trust Moderation
router.get('/reviews', AdminController.getReviews);
router.patch('/reviews/:id/visibility', requireRoles('ADMIN'), AdminController.toggleReviewVisibility);

// Categories
router.get('/categories', AdminController.getCategories);
router.post('/categories', validate(createCategorySchema), AdminController.createCategory);
router.put('/categories/:id', validate(updateCategorySchema), AdminController.updateCategory);
router.patch('/categories/:id', validate(updateCategorySchema), AdminController.updateCategory);
router.delete('/categories/:id', AdminController.deleteCategory);

// Skills
router.get('/skills', AdminController.getSkills);
router.post('/skills', validate(createSkillSchema), AdminController.createSkill);
router.put('/skills/:id', validate(updateSkillSchema), AdminController.updateSkill);
router.patch('/skills/:id', validate(updateSkillSchema), AdminController.updateSkill);
router.delete('/skills/:id', AdminController.deleteSkill);

// Audit Trail
router.get('/audit-logs', requireRoles('ADMIN'), AdminController.getAuditLogs);

// System Settings
router.get('/settings', requireRoles('ADMIN'), AdminController.getSettings);
router.put('/settings/:key', requireRoles('ADMIN'), validate(updateSystemSettingSchema), AdminController.updateSetting);
router.patch('/settings/:key', requireRoles('ADMIN'), validate(updateSystemSettingSchema), AdminController.updateSetting);

export default router;
