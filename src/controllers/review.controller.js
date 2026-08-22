import { ReviewService } from '../services/review.service.js';
import { ApiResponse } from '../utils/api-response.js';

export class ReviewController {
  static async create(req, res, next) {
    try {
      const result = await ReviewService.createReview(req.user.id, req.body);
      res.status(201).json(new ApiResponse(201, result, 'Review submitted successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const result = await ReviewService.updateReview(req.user.id, req.params.id, req.body);
      res.status(200).json(new ApiResponse(200, result, 'Review updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async reply(req, res, next) {
    try {
      const result = await ReviewService.replyToReview(req.user.id, req.params.reviewId, req.body.artisanReply);
      res.status(200).json(new ApiResponse(200, result, 'Artisan reply posted successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPPORT';
      await ReviewService.deleteReview(req.user.id, req.params.id, isAdmin);
      res.status(200).json(new ApiResponse(200, null, 'Review deleted successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async getArtisanReviews(req, res, next) {
    try {
      const result = await ReviewService.getArtisanReviews(req.params.artisanUserId);
      res.status(200).json(new ApiResponse(200, result, 'Artisan reviews fetched'));
    } catch (error) {
      next(error);
    }
  }
}

export default ReviewController;
