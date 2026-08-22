import { z } from 'zod';

export const createReviewSchema = z.object({
  body: z.object({
    contractId: z.string().uuid('Valid contract UUID required'),
    overallRating: z.number().int().min(1, 'Rating must be between 1 and 5').max(5, 'Rating must be between 1 and 5'),
    qualityRating: z.number().int().min(1).max(5).optional(),
    communicationRating: z.number().int().min(1).max(5).optional(),
    punctualityRating: z.number().int().min(1).max(5).optional(),
    comment: z.string().min(5, 'Review comment must be at least 5 characters').max(1000).optional(),
  }),
});

export const updateReviewSchema = z.object({
  body: z.object({
    overallRating: z.number().int().min(1).max(5).optional(),
    qualityRating: z.number().int().min(1).max(5).optional(),
    communicationRating: z.number().int().min(1).max(5).optional(),
    punctualityRating: z.number().int().min(1).max(5).optional(),
    comment: z.string().min(5).max(1000).optional(),
  }),
  params: z.object({
    id: z.string().uuid('Valid review UUID required'),
  }),
});

export const replyReviewSchema = z.object({
  body: z.object({
    artisanReply: z.string().min(5, 'Reply must be at least 5 characters').max(1000),
  }),
  params: z.object({
    reviewId: z.string().uuid('Valid review UUID required'),
  }),
});

export const reviewParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Valid review UUID required'),
  }),
});
