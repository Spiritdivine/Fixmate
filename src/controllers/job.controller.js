import { JobService } from '../services/job.service.js';
import { ApiResponse } from '../utils/api-response.js';
import prisma from '../config/db.js';

export class JobController {
  static async create(req, res, next) {
    try {
      const result = await JobService.createJob(req.user.id, req.body);
      res.status(201).json(new ApiResponse(201, result, 'Job posted successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const result = await JobService.updateJob(req.user.id, req.params.id, req.body);
      res.status(200).json(new ApiResponse(200, result, 'Job updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req, res, next) {
    try {
      const result = await JobService.updateJobStatus(req.user.id, req.params.id, req.body.status);
      res.status(200).json(new ApiResponse(200, result, 'Job status updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      await JobService.deleteJob(req.user.id, req.params.id);
      res.status(200).json(new ApiResponse(200, null, 'Job deleted successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async deleteAttachment(req, res, next) {
    try {
      await JobService.deleteJobAttachment(req.user.id, req.params.id, req.params.attachmentId);
      res.status(200).json(new ApiResponse(200, null, 'Job attachment deleted successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async list(req, res, next) {
    try {
      const result = await JobService.getJobs(req.query);
      res.status(200).json(new ApiResponse(200, result, 'Jobs fetched successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const result = await JobService.getJobById(req.params.id);
      res.status(200).json(new ApiResponse(200, result, 'Job details'));
    } catch (error) {
      next(error);
    }
  }

  static async getMyJobs(req, res, next) {
    try {
      const result = await JobService.getClientJobs(req.user.id);
      res.status(200).json(new ApiResponse(200, result, 'Client jobs fetched'));
    } catch (error) {
      next(error);
    }
  }

  static async listCategories(req, res, next) {
    try {
      const categories = await prisma.jobCategory.findMany({
        where: { isActive: true, parentId: null },
        include: {
          children: true,
          skills: true,
        },
      });
      res.status(200).json(new ApiResponse(200, categories, 'Categories fetched'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Invitations
   */
  static async inviteArtisan(req, res, next) {
    try {
      const result = await JobService.inviteArtisan(req.user.id, req.params.id, req.params.artisanId);
      res.status(201).json(new ApiResponse(201, result, 'Artisan invited to job successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async getMyInvitations(req, res, next) {
    try {
      const result = await JobService.getArtisanInvitations(req.user.id);
      res.status(200).json(new ApiResponse(200, result, 'Job invitations fetched'));
    } catch (error) {
      next(error);
    }
  }

  static async respondInvitation(req, res, next) {
    try {
      const result = await JobService.respondToInvitation(req.user.id, req.params.id, req.body.status);
      res.status(200).json(new ApiResponse(200, result, 'Invitation response recorded'));
    } catch (error) {
      next(error);
    }
  }

  static async cancelInvitation(req, res, next) {
    try {
      await JobService.cancelInvitation(req.user.id, req.params.id);
      res.status(200).json(new ApiResponse(200, null, 'Job invitation cancelled'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Saves / Bookmarks
   */
  static async saveJob(req, res, next) {
    try {
      const result = await JobService.saveJob(req.user.id, req.params.id);
      res.status(200).json(new ApiResponse(200, result, 'Job saved to bookmarks'));
    } catch (error) {
      next(error);
    }
  }

  static async unsaveJob(req, res, next) {
    try {
      await JobService.unsaveJob(req.user.id, req.params.id);
      res.status(200).json(new ApiResponse(200, null, 'Job removed from bookmarks'));
    } catch (error) {
      next(error);
    }
  }

  static async getSavedJobs(req, res, next) {
    try {
      const result = await JobService.getSavedJobs(req.user.id);
      res.status(200).json(new ApiResponse(200, result, 'Saved jobs fetched'));
    } catch (error) {
      next(error);
    }
  }
}

export default JobController;
