import { apiClient } from '../lib/api-client';
import { ApiResponse, ProposalRecord, MilestoneProposal } from '../types/api-contracts';

export interface SubmitProposalPayload {
  jobId: string;
  amount: number;
  durationDays: number;
  coverLetter: string;
  milestones?: MilestoneProposal[];
}

/**
 * ProposalService (SRP):
 * Manages artisan bid submissions, client proposal reviews, and bid status updates.
 */
export class ProposalService {
  static async submit(payload: SubmitProposalPayload): Promise<ProposalRecord> {
    const response = await apiClient.post<ApiResponse<ProposalRecord>>('/proposals', payload);
    return response.data.data;
  }

  static async getMyProposals(): Promise<ProposalRecord[]> {
    const response = await apiClient.get<ApiResponse<ProposalRecord[]>>('/proposals/my-proposals');
    return response.data.data;
  }

  static async getJobProposals(jobId: string): Promise<ProposalRecord[]> {
    const response = await apiClient.get<ApiResponse<ProposalRecord[]>>(`/proposals/job/${jobId}`);
    return response.data.data;
  }

  static async getById(id: string): Promise<ProposalRecord> {
    const response = await apiClient.get<ApiResponse<ProposalRecord>>(`/proposals/${id}`);
    return response.data.data;
  }

  static async updateStatus(id: string, status: 'ACCEPTED' | 'REJECTED'): Promise<ProposalRecord> {
    const response = await apiClient.patch<ApiResponse<ProposalRecord>>(`/proposals/${id}/status`, { status });
    return response.data.data;
  }

  static async withdraw(id: string): Promise<void> {
    await apiClient.delete(`/proposals/${id}`);
  }
}
