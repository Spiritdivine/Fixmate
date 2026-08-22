import { ProfileService } from '../services/profile.service.js';
import { ApiResponse } from '../utils/api-response.js';

export class ProfileController {
  static async updateArtisan(req, res, next) {
    try {
      const result = await ProfileService.updateArtisanProfile(req.user.id, req.body);
      res.status(200).json(new ApiResponse(200, result, 'Artisan profile updated'));
    } catch (error) {
      next(error);
    }
  }

  static async updateClient(req, res, next) {
    try {
      const result = await ProfileService.updateClientProfile(req.user.id, req.body);
      res.status(200).json(new ApiResponse(200, result, 'Client profile updated'));
    } catch (error) {
      next(error);
    }
  }

  static async listArtisans(req, res, next) {
    try {
      const result = await ProfileService.getArtisans(req.query);
      res.status(200).json(new ApiResponse(200, result, 'Artisans fetched successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async getArtisanDetails(req, res, next) {
    try {
      const result = await ProfileService.getArtisanById(req.params.id);
      res.status(200).json(new ApiResponse(200, result, 'Artisan profile details'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Portfolio
   */
  static async addPortfolio(req, res, next) {
    try {
      const result = await ProfileService.addPortfolioItem(req.user.id, req.body);
      res.status(201).json(new ApiResponse(201, result, 'Portfolio item created'));
    } catch (error) {
      next(error);
    }
  }

  static async updatePortfolio(req, res, next) {
    try {
      const result = await ProfileService.updatePortfolioItem(req.user.id, req.params.id, req.body);
      res.status(200).json(new ApiResponse(200, result, 'Portfolio item updated'));
    } catch (error) {
      next(error);
    }
  }

  static async deletePortfolio(req, res, next) {
    try {
      await ProfileService.deletePortfolioItem(req.user.id, req.params.id);
      res.status(200).json(new ApiResponse(200, null, 'Portfolio item deleted'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Packaged Services
   */
  static async createService(req, res, next) {
    try {
      const result = await ProfileService.createArtisanService(req.user.id, req.body);
      res.status(201).json(new ApiResponse(201, result, 'Service catalog item created'));
    } catch (error) {
      next(error);
    }
  }

  static async updateService(req, res, next) {
    try {
      const result = await ProfileService.updateArtisanService(req.user.id, req.params.id, req.body);
      res.status(200).json(new ApiResponse(200, result, 'Service catalog item updated'));
    } catch (error) {
      next(error);
    }
  }

  static async deleteService(req, res, next) {
    try {
      await ProfileService.deleteArtisanService(req.user.id, req.params.id);
      res.status(200).json(new ApiResponse(200, null, 'Service catalog item deleted'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Saved Artisans
   */
  static async saveArtisan(req, res, next) {
    try {
      const result = await ProfileService.saveArtisan(req.user.id, req.params.id);
      res.status(200).json(new ApiResponse(200, result, 'Artisan bookmarked'));
    } catch (error) {
      next(error);
    }
  }

  static async unsaveArtisan(req, res, next) {
    try {
      await ProfileService.unsaveArtisan(req.user.id, req.params.id);
      res.status(200).json(new ApiResponse(200, null, 'Artisan removed from bookmarks'));
    } catch (error) {
      next(error);
    }
  }

  static async getSavedArtisans(req, res, next) {
    try {
      const result = await ProfileService.getSavedArtisans(req.user.id);
      res.status(200).json(new ApiResponse(200, result, 'Saved artisans fetched'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Availability & Location
   */
  static async toggleAvailability(req, res, next) {
    try {
      const result = await ProfileService.toggleAvailability(req.user.id, req.body.isAvailable);
      res.status(200).json(new ApiResponse(200, result, 'Availability updated'));
    } catch (error) {
      next(error);
    }
  }

  static async updateLocation(req, res, next) {
    try {
      const { latitude, longitude } = req.body;
      const result = await ProfileService.updateLocation(req.user.id, latitude, longitude);
      res.status(200).json(new ApiResponse(200, result, 'Location coordinates updated'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Account Deactivation
   */
  static async deleteAccount(req, res, next) {
    try {
      await ProfileService.softDeleteAccount(req.user.id);
      res.status(200).json(new ApiResponse(200, null, 'Account deactivated successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * KYC
   */
  static async submitKyc(req, res, next) {
    try {
      const result = await ProfileService.submitKyc(req.user.id, req.body);
      res.status(201).json(new ApiResponse(201, result, 'KYC submitted for review'));
    } catch (error) {
      next(error);
    }
  }

  static async reviewKyc(req, res, next) {
    try {
      const result = await ProfileService.reviewKyc(req.user.id, req.params.id, req.body);
      res.status(200).json(new ApiResponse(200, result, 'KYC status updated'));
    } catch (error) {
      next(error);
    }
  }

  static async updateWalletAddress(req, res, next) {
    try {
      const result = await ProfileService.updateWalletAddress(req.user.id, req.body.walletAddress);
      res.status(200).json(new ApiResponse(200, result, 'Wallet address linked successfully'));
    } catch (error) {
      next(error);
    }
  }
}

export default ProfileController;
