import { AdminService } from '../services/admin.service.js';
import { ApiResponse } from '../utils/api-response.js';

export class AdminController {
  /**
   * Categories
   */
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
   * User Moderation
   */
  static async updateUserStatus(req, res, next) {
    try {
      const { status, reason } = req.body;
      const result = await AdminService.updateUserStatus(req.user.id, req.params.id, status, reason);
      res.status(200).json(new ApiResponse(200, result, 'User status updated successfully'));
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
