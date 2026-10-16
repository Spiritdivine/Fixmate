import { apiClient } from '../lib/api-client';
import { ApiResponse, MilestoneRecord } from '../types/api-contracts';

export interface SubmitWorkPayload {
  workNotes: string;
  proofAttachments: Array<{
    url: string;
    fileType: string;
    tag?: 'BEFORE' | 'AFTER' | 'IN_PROGRESS';
  }>;
}

export interface ApproveReleasePayload {
  rating?: number;
  feedback?: string;
}

/**
 * EscrowService (SRP):
 * Manages institutional escrow funding, proof of work submission,
 * revision requests, and cryptographic milestone release.
 */
export class EscrowService {
  static async fundMilestone(milestoneId: string, fundingSource: 'FIAT' | 'CRYPTO' = 'FIAT'): Promise<MilestoneRecord> {
    const response = await apiClient.post<ApiResponse<MilestoneRecord>>(
      `/escrow/fund-milestone/${milestoneId}`,
      { fundingSource }
    );
    return response.data.data;
  }

  static async submitWork(milestoneId: string, payload: SubmitWorkPayload): Promise<MilestoneRecord> {
    const response = await apiClient.post<ApiResponse<MilestoneRecord>>(
      `/escrow/submit-work/${milestoneId}`,
      payload
    );
    return response.data.data;
  }

  static async requestRevision(milestoneId: string, revisionNotes: string): Promise<MilestoneRecord> {
    const response = await apiClient.patch<ApiResponse<MilestoneRecord>>(
      `/escrow/request-revision/${milestoneId}`,
      { revisionNotes }
    );
    return response.data.data;
  }

  static async approveRelease(milestoneId: string, payload: ApproveReleasePayload = {}): Promise<MilestoneRecord> {
    const response = await apiClient.post<ApiResponse<MilestoneRecord>>(
      `/escrow/approve-release/${milestoneId}`,
      payload
    );
    return response.data.data;
  }

  static async refundMilestone(milestoneId: string, reason?: string): Promise<MilestoneRecord> {
    const response = await apiClient.post<ApiResponse<MilestoneRecord>>(
      `/escrow/refund-milestone/${milestoneId}`,
      { reason }
    );
    return response.data.data;
  }
}
