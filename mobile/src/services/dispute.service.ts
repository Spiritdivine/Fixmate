import { apiClient } from '../lib/api-client';
import { ApiResponse } from '../types/api-contracts';
import {
  DisputeRecord,
  CreateDisputePayload,
  DisputeEvidenceRecord,
} from '../types/dispute-contracts';

/**
 * DisputeService (SRP):
 * Manages institutional dispute arbitration, case lookups, and rebuttal submissions.
 */
export class DisputeService {
  static async listDisputes(): Promise<DisputeRecord[]> {
    const response = await apiClient.get<ApiResponse<DisputeRecord[]>>('/disputes');
    return response.data.data;
  }

  static async getById(disputeId: string): Promise<DisputeRecord> {
    const response = await apiClient.get<ApiResponse<DisputeRecord>>(`/disputes/${disputeId}`);
    return response.data.data;
  }

  static async create(payload: CreateDisputePayload): Promise<DisputeRecord> {
    const body = {
      ...payload,
      explanation: payload.explanation || payload.description,
    };
    const response = await apiClient.post<ApiResponse<DisputeRecord>>('/disputes', body);
    return response.data.data;
  }

  static async submitEvidence(
    disputeId: string,
    comment: string,
    attachments?: Array<{ url: string; fileType: string }>
  ): Promise<DisputeEvidenceRecord> {
    const response = await apiClient.post<ApiResponse<DisputeEvidenceRecord>>(
      `/disputes/${disputeId}/evidence`,
      { comment, attachments }
    );
    return response.data.data;
  }
}
