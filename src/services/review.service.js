import prisma from '../config/db.js';
import { ApiError } from '../utils/api-error.js';
import { NotificationService } from './notification.service.js';

export class ReviewService {
  static async createReview(reviewerId, data) {
    const { contractId, overallRating, qualityRating, communicationRating, punctualityRating, comment } = data;

    const contract = await prisma.contract.findUnique({ where: { id: contractId } });
    if (!contract) throw ApiError.notFound('Contract not found');
    if (contract.status !== 'COMPLETED') throw ApiError.badRequest('Reviews can only be left on completed contracts');

    const revieweeId = reviewerId === contract.clientId ? contract.artisanId : contract.clientId;

    const existing = await prisma.review.findUnique({
      where: {
        contractId_reviewerId: { contractId, reviewerId },
      },
    });

    if (existing) throw ApiError.conflict('You have already reviewed this contract');

    return prisma.$transaction(async (tx) => {
      const review = await tx.review.create({
        data: {
          contractId,
          reviewerId,
          revieweeId,
          overallRating,
          qualityRating,
          communicationRating,
          punctualityRating,
          comment,
        },
      });

      // If review is for artisan, recompute aggregate rating
      const artisanProfile = await tx.artisanProfile.findUnique({ where: { userId: revieweeId } });
      if (artisanProfile) {
        const allReviews = await tx.review.findMany({
          where: { revieweeId, isPublic: true },
          select: { overallRating: true },
        });

        const totalScore = allReviews.reduce((acc, curr) => acc + curr.overallRating, 0);
        const avg = (totalScore / allReviews.length).toFixed(2);

        await tx.artisanProfile.update({
          where: { id: artisanProfile.id },
          data: {
            ratingAvg: Number(avg),
            reviewCount: allReviews.length,
          },
        });
      }

      await NotificationService.createNotification(
        revieweeId,
        'New Review Received ⭐',
        `A client left a ${overallRating}-star review on Contract #${contract.contractCode}`,
        `/profiles/artisans/${artisanProfile ? artisanProfile.id : revieweeId}`
      );

      return review;
    });
  }

  static async updateReview(reviewerId, reviewId, data) {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw ApiError.notFound('Review not found');
    if (review.reviewerId !== reviewerId) throw ApiError.forbidden('Unauthorized: not review author');

    return prisma.$transaction(async (tx) => {
      const updated = await tx.review.update({
        where: { id: reviewId },
        data,
      });

      // Recompute artisan aggregate rating
      const artisanProfile = await tx.artisanProfile.findUnique({ where: { userId: review.revieweeId } });
      if (artisanProfile) {
        const allReviews = await tx.review.findMany({
          where: { revieweeId: review.revieweeId, isPublic: true },
          select: { overallRating: true },
        });

        const totalScore = allReviews.reduce((acc, curr) => acc + curr.overallRating, 0);
        const avg = (totalScore / allReviews.length).toFixed(2);

        await tx.artisanProfile.update({
          where: { id: artisanProfile.id },
          data: {
            ratingAvg: Number(avg),
            reviewCount: allReviews.length,
          },
        });
      }

      return updated;
    });
  }

  static async replyToReview(artisanId, reviewId, replyText) {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw ApiError.notFound('Review not found');
    if (review.revieweeId !== artisanId) {
      throw ApiError.forbidden('Only the reviewed artisan can reply to this review');
    }

    return prisma.review.update({
      where: { id: reviewId },
      data: { artisanReply: replyText },
    });
  }

  static async deleteReview(userId, reviewId, isAdmin = false) {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw ApiError.notFound('Review not found');
    if (!isAdmin && review.reviewerId !== userId) {
      throw ApiError.forbidden('Unauthorized to delete review');
    }

    return prisma.$transaction(async (tx) => {
      const deleted = await tx.review.delete({ where: { id: reviewId } });

      // Recompute artisan aggregate rating
      const artisanProfile = await tx.artisanProfile.findUnique({ where: { userId: review.revieweeId } });
      if (artisanProfile) {
        const allReviews = await tx.review.findMany({
          where: { revieweeId: review.revieweeId, isPublic: true },
          select: { overallRating: true },
        });

        const totalScore = allReviews.reduce((acc, curr) => acc + curr.overallRating, 0);
        const avg = allReviews.length > 0 ? (totalScore / allReviews.length).toFixed(2) : '0.00';

        await tx.artisanProfile.update({
          where: { id: artisanProfile.id },
          data: {
            ratingAvg: Number(avg),
            reviewCount: allReviews.length,
          },
        });
      }

      return deleted;
    });
  }

  static async getArtisanReviews(artisanUserId) {
    return prisma.review.findMany({
      where: { revieweeId: artisanUserId, isPublic: true },
      include: {
        reviewer: {
          select: { id: true, clientProfile: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export default ReviewService;
