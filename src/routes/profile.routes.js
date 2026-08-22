import { Router } from 'express';
import { ProfileController } from '../controllers/profile.controller.js';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticate, requireRoles } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  updateArtisanProfileSchema,
  updateClientProfileSchema,
  portfolioItemSchema,
  updatePortfolioItemSchema,
  portfolioParamSchema,
  createArtisanServiceSchema,
  updateArtisanServiceSchema,
  serviceParamSchema,
  kycSubmissionSchema,
  kycReviewSchema,
  updateWalletAddressSchema,
  updateAvailabilitySchema,
  updateLocationSchema,
  artisanParamSchema,
} from '../validators/profile.validator.js';
import { updateAvatarSchema } from '../validators/auth.validator.js';

const router = Router();

// Public artisan discovery
router.get('/artisans', ProfileController.listArtisans);
router.get('/artisans/:id', ProfileController.getArtisanDetails);

// Saved Artisans (Bookmarks)
router.get('/saved-artisans', authenticate, requireRoles('CLIENT'), ProfileController.getSavedArtisans);
router.post('/artisans/:id/save', authenticate, requireRoles('CLIENT'), validate(artisanParamSchema), ProfileController.saveArtisan);
router.delete('/artisans/:id/save', authenticate, requireRoles('CLIENT'), validate(artisanParamSchema), ProfileController.unsaveArtisan);

// Avatar & Wallet address binding
router.patch('/wallet-address', authenticate, validate(updateWalletAddressSchema), ProfileController.updateWalletAddress);
router.patch('/avatar', authenticate, validate(updateAvatarSchema), AuthController.updateAvatar);
router.delete('/avatar', authenticate, AuthController.deleteAvatar);
router.delete('/account', authenticate, ProfileController.deleteAccount);

// Client profile
router.patch('/client', authenticate, requireRoles('CLIENT'), validate(updateClientProfileSchema), ProfileController.updateClient);
router.put('/client', authenticate, requireRoles('CLIENT'), validate(updateClientProfileSchema), ProfileController.updateClient);

// Artisan profile & availability
router.patch('/artisan', authenticate, requireRoles('ARTISAN'), validate(updateArtisanProfileSchema), ProfileController.updateArtisan);
router.put('/artisan', authenticate, requireRoles('ARTISAN'), validate(updateArtisanProfileSchema), ProfileController.updateArtisan);
router.patch('/artisan/availability', authenticate, requireRoles('ARTISAN'), validate(updateAvailabilitySchema), ProfileController.toggleAvailability);
router.patch('/artisan/location', authenticate, requireRoles('ARTISAN'), validate(updateLocationSchema), ProfileController.updateLocation);

// Artisan Portfolios
router.post('/artisan/portfolio', authenticate, requireRoles('ARTISAN'), validate(portfolioItemSchema), ProfileController.addPortfolio);
router.put('/artisan/portfolio/:id', authenticate, requireRoles('ARTISAN'), validate(updatePortfolioItemSchema), ProfileController.updatePortfolio);
router.patch('/artisan/portfolio/:id', authenticate, requireRoles('ARTISAN'), validate(updatePortfolioItemSchema), ProfileController.updatePortfolio);
router.delete('/artisan/portfolio/:id', authenticate, requireRoles('ARTISAN'), validate(portfolioParamSchema), ProfileController.deletePortfolio);

// Artisan Services Catalog
router.post('/artisan/services', authenticate, requireRoles('ARTISAN'), validate(createArtisanServiceSchema), ProfileController.createService);
router.put('/artisan/services/:id', authenticate, requireRoles('ARTISAN'), validate(updateArtisanServiceSchema), ProfileController.updateService);
router.patch('/artisan/services/:id', authenticate, requireRoles('ARTISAN'), validate(updateArtisanServiceSchema), ProfileController.updateService);
router.delete('/artisan/services/:id', authenticate, requireRoles('ARTISAN'), validate(serviceParamSchema), ProfileController.deleteService);

// KYC
router.post('/kyc', authenticate, validate(kycSubmissionSchema), ProfileController.submitKyc);
router.patch('/kyc/:id/review', authenticate, requireRoles('ADMIN', 'SUPPORT'), validate(kycReviewSchema), ProfileController.reviewKyc);

export default router;
