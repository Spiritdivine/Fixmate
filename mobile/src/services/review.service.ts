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

  static async getMyReviews(): Promise<ReviewRecord[]> {
    try {
      const response = await apiClient.get<ApiResponse<ReviewRecord[]>>('/reviews/my-reviews');
      return Array.isArray(response.data.data) ? response.data.data : [];
    } catch {
      return [];
    }
  }

  static async updateReview(id: string, payload: Partial<SubmitReviewPayload>): Promise<ReviewRecord> {
    const response = await apiClient.patch<ApiResponse<ReviewRecord>>(`/reviews/${id}`, payload);
    return response.data.data;
  }
}
