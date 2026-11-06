import { apiClient } from '../lib/api-client';
import { ApiResponse, ProposalRecord, MilestoneProposal } from '../types/api-contracts';

export interface SubmitProposalPayload {
  jobId: string;
  bidAmount?: number;
  amount?: number;
  estimatedDays?: number;
  durationDays?: number;
  coverLetter: string;
  milestones?: MilestoneProposal[];
}

/**
 * ProposalService (SRP):
 * Manages artisan bid submissions, client proposal reviews, and bid status updates.
 */
export class ProposalService {
  static async submit(payload: SubmitProposalPayload): Promise<ProposalRecord> {
    const bidAmount = Number(payload.bidAmount ?? payload.amount ?? 0);
    const estimatedDays = Number(payload.estimatedDays ?? payload.durationDays ?? 1);
    const normalizedMilestones = payload.milestones && payload.milestones.length > 0
      ? payload.milestones.map((m, idx) => ({
          stepOrder: m.stepOrder ?? idx + 1,
          title: m.title,
          amount: Number(m.amount),
          estimatedDays: Number(m.estimatedDays ?? m.durationDays ?? Math.max(1, Math.round(estimatedDays / payload.milestones!.length))),
        }))
      : undefined;

    const body = {
      jobId: payload.jobId,
      bidAmount,
      estimatedDays,
      coverLetter: payload.coverLetter,
      milestones: normalizedMilestones,
    };

    const response = await apiClient.post<ApiResponse<ProposalRecord>>('/proposals', body);
    return response.data.data;
  }

  static async update(id: string, payload: Partial<SubmitProposalPayload>): Promise<ProposalRecord> {
    const body: Record<string, unknown> = {};
    if (payload.bidAmount != null || payload.amount != null) {
      body.bidAmount = Number(payload.bidAmount ?? payload.amount);
    }
    if (payload.estimatedDays != null || payload.durationDays != null) {
      body.estimatedDays = Number(payload.estimatedDays ?? payload.durationDays);
    }
    if (payload.coverLetter != null) {
      body.coverLetter = payload.coverLetter;
    }
    if (payload.milestones && payload.milestones.length > 0) {
      body.milestones = payload.milestones.map((m, idx) => ({
        stepOrder: m.stepOrder ?? idx + 1,
        title: m.title,
        amount: Number(m.amount),
        estimatedDays: Number(m.estimatedDays ?? m.durationDays ?? 1),
      }));
    }

    const response = await apiClient.put<ApiResponse<ProposalRecord>>(`/proposals/${id}`, body);
    return response.data.data;
  }

  static async updateProposal(id: string, payload: Partial<SubmitProposalPayload>): Promise<ProposalRecord> {
    return this.update(id, payload);
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

  static async updateStatus(id: string, status: 'SHORTLISTED' | 'REJECTED' | 'ACCEPTED'): Promise<ProposalRecord> {
    const response = await apiClient.patch<ApiResponse<ProposalRecord>>(`/proposals/${id}/status`, { status });
    return response.data.data;
  }

  static async withdraw(id: string): Promise<void> {
    await apiClient.delete(`/proposals/${id}`);
  }
}
