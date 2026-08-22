import { AdminService } from '../services/admin.service.js';
import { ApiResponse } from '../utils/api-response.js';

export class AdminController {
  /**
   * Analytics & Overview
   */
  static async getAnalyticsOverview(req, res, next) {
    try {
      const result = await AdminService.getAnalyticsOverview();
      res.status(200).json(new ApiResponse(200, result, 'Analytics overview fetched successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Users Management
   */
  static async getUsers(req, res, next) {
    try {
      const result = await AdminService.getUsers(req.query);
      res.status(200).json(new ApiResponse(200, result, 'Users fetched successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async getUserById(req, res, next) {
    try {
      const result = await AdminService.getUserById(req.params.id);
      res.status(200).json(new ApiResponse(200, result, 'User details fetched successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async updateUserStatus(req, res, next) {
    try {
      const { status, reason } = req.body;
      const result = await AdminService.updateUserStatus(req.user.id, req.params.id, status, reason);
      res.status(200).json(new ApiResponse(200, result, 'User status updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async manuallyVerifyUser(req, res, next) {
    try {
      const result = await AdminService.manuallyVerifyUser(req.user.id, req.params.id, req.body);
      res.status(200).json(new ApiResponse(200, result, 'User verification status updated successfully'));
    } catch (error) {
      next(error);
    }
  }


  /**
   * KYC Submissions Queue
   */
  static async getKycSubmissions(req, res, next) {
    try {
      const result = await AdminService.getKycSubmissions(req.query);
      res.status(200).json(new ApiResponse(200, result, 'KYC submissions fetched successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Disputes Management
   */
  static async getDisputes(req, res, next) {
    try {
      const result = await AdminService.getDisputes(req.query);
      res.status(200).json(new ApiResponse(200, result, 'Disputes fetched successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async getDisputeById(req, res, next) {
    try {
      const result = await AdminService.getDisputeById(req.params.id);
      res.status(200).json(new ApiResponse(200, result, 'Dispute details fetched successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Contracts Oversight
   */
  static async getContracts(req, res, next) {
    try {
      const result = await AdminService.getContracts(req.query);
      res.status(200).json(new ApiResponse(200, result, 'Contracts fetched successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async getContractById(req, res, next) {
    try {
      const result = await AdminService.getContractById(req.params.id);
      res.status(200).json(new ApiResponse(200, result, 'Contract details fetched successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Financial Transactions
   */
  static async getTransactions(req, res, next) {
    try {
      const result = await AdminService.getTransactions(req.query);
      res.status(200).json(new ApiResponse(200, result, 'Transactions fetched successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Payouts Moderation
   */
  static async getPayouts(req, res, next) {
    try {
      const result = await AdminService.getPayouts(req.query);
      res.status(200).json(new ApiResponse(200, result, 'Payout requests fetched successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async updatePayoutStatus(req, res, next) {
    try {
      const { status, gatewayTransferCode, failureReason } = req.body;
      const result = await AdminService.updatePayoutStatus(req.user.id, req.params.id, {
        status,
        gatewayTransferCode,
        failureReason,
      });
      res.status(200).json(new ApiResponse(200, result, 'Payout status updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reviews Moderation
   */
  static async getReviews(req, res, next) {
    try {
      const result = await AdminService.getReviews(req.query);
      res.status(200).json(new ApiResponse(200, result, 'Reviews fetched successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async toggleReviewVisibility(req, res, next) {
    try {
      const { isPublic } = req.body;
      const result = await AdminService.toggleReviewVisibility(req.user.id, req.params.id, isPublic);
      res.status(200).json(new ApiResponse(200, result, 'Review visibility updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Categories
   */
  static async getCategories(req, res, next) {
    try {
      const result = await AdminService.getCategoriesWithStats();
      res.status(200).json(new ApiResponse(200, result, 'Categories fetched successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async createCategory(req, res, next) {
    try {
      const result = await AdminService.createCategory(req.body);
      res.status(201).json(new ApiResponse(201, result, 'Category created successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async updateCategory(req, res, next) {
    try {
      const result = await AdminService.updateCategory(req.params.id, req.body);
      res.status(200).json(new ApiResponse(200, result, 'Category updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async deleteCategory(req, res, next) {
    try {
      const result = await AdminService.deleteCategory(req.params.id);
      res.status(200).json(new ApiResponse(200, result, 'Category deactivated successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Skills
   */
  static async getSkills(req, res, next) {
    try {
      const result = await AdminService.getSkillsWithStats(req.query);
      res.status(200).json(new ApiResponse(200, result, 'Skills fetched successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async createSkill(req, res, next) {
    try {
      const result = await AdminService.createSkill(req.body);
      res.status(201).json(new ApiResponse(201, result, 'Skill created successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async updateSkill(req, res, next) {
    try {
      const result = await AdminService.updateSkill(req.params.id, req.body);
      res.status(200).json(new ApiResponse(200, result, 'Skill updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async deleteSkill(req, res, next) {
    try {
      const result = await AdminService.deleteSkill(req.params.id);
      res.status(200).json(new ApiResponse(200, result, 'Skill deleted successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Audit Logs
   */
  static async getAuditLogs(req, res, next) {
    try {
      const result = await AdminService.getAuditLogs(req.query);
      res.status(200).json(new ApiResponse(200, result, 'Audit logs fetched successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * System Settings
   */
  static async getSettings(req, res, next) {
    try {
      const result = await AdminService.getSystemSettings();
      res.status(200).json(new ApiResponse(200, result, 'System settings fetched'));
    } catch (error) {
      next(error);
    }
  }

  static async updateSetting(req, res, next) {
    try {
      const { value, description } = req.body;
      const result = await AdminService.updateSystemSetting(req.user.id, req.params.key, value, description);
      res.status(200).json(new ApiResponse(200, result, 'System setting updated'));
    } catch (error) {
      next(error);
    }
  }
}

export default AdminController;
