import { apiClient } from '../lib/api-client';
import { ApiResponse } from '../types/api-contracts';
import { ReviewRecord, SubmitReviewPayload } from '../types/review-contracts';

/**
 * ReviewService (SRP):
 * Manages post-job reputation ratings, feedback tags, and artisan tipping.
 */
export class ReviewService {
  static async submitReview(payload: SubmitReviewPayload): Promise<ReviewRecord> {
    const response = await apiClient.post<ApiResponse<ReviewRecord>>('/reviews', payload);
    return response.data.data;
  }

  static async getArtisanReviews(artisanId: string): Promise<ReviewRecord[]> {
    const response = await apiClient.get<ApiResponse<ReviewRecord[]>>(`/reviews/artisan/${artisanId}`);
    return response.data.data;
  }
}
