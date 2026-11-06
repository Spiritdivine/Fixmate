import { apiClient } from '../lib/api-client';
import { ApiResponse, JobRecord, BudgetType, JobUrgency, JobInvitationRecord } from '../types/api-contracts';

export interface CreateJobPayload {
  title: string;
  description: string;
  categoryId?: number;
  trade?: string;
  location?: string;
  state?: string;
  lgaCity?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  budget?: number;
  budgetMin?: number;
  budgetMax?: number;
  budgetType?: BudgetType;
  urgency?: JobUrgency;
  expectedOutcome?: string;
  materialsProvidedBy?: string;
  completionProofReq?: string;
  deadlineDate?: string;
  attachments?: Array<{ fileUrl: string; fileName: string; fileSizeBytes: number; mimeType: string }>;
}

export interface JobListQuery {
  categoryId?: number;
  trade?: string;
  status?: string;
  search?: string;
  minBudget?: number;
  maxBudget?: number;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  page?: number;
  limit?: number;
}

/**
 * JobService (SRP):
 * Manages marketplace job discovery, creation wizard, client job listings,
 * and bookmark operations.
 */
export class JobService {
  static async listCategories(): Promise<any[]> {
    const response = await apiClient.get<ApiResponse<any[]>>('/jobs/categories');
    return response.data.data;
  }

  static async listJobs(query: JobListQuery = {}): Promise<JobRecord[]> {
    const response = await apiClient.get<ApiResponse<JobRecord[] | { jobs: JobRecord[] }>>('/jobs', { params: query });
    const data = response.data.data;
    if (data && Array.isArray((data as any).jobs)) {
      return (data as any).jobs;
    }
    return Array.isArray(data) ? data : [];
  }

  static async getMyJobs(status?: string): Promise<JobRecord[]> {
    const response = await apiClient.get<ApiResponse<JobRecord[] | { jobs: JobRecord[] }>>('/jobs/my-jobs', {
      params: status ? { status } : undefined,
    });
    const data = response.data.data;
    if (data && Array.isArray((data as any).jobs)) {
      return (data as any).jobs;
    }
    return Array.isArray(data) ? data : [];
  }

  static async getById(id: string): Promise<JobRecord> {
    const response = await apiClient.get<ApiResponse<JobRecord>>(`/jobs/${id}`);
    return response.data.data;
  }

  static async create(payload: CreateJobPayload): Promise<JobRecord> {
    // Map trade to categoryId if missing
    let categoryId = payload.categoryId;
    if (!categoryId && payload.trade) {
      const lower = payload.trade.toLowerCase();
      if (lower.includes('electric') || lower.includes('solar') || lower.includes('wire')) {
        categoryId = 1;
      } else if (lower.includes('plumb') || lower.includes('pipe') || lower.includes('drain')) {
        categoryId = 2;
      } else if (lower.includes('carpent') || lower.includes('wood')) {
        categoryId = 3;
      } else if (lower.includes('mason') || lower.includes('tile') || lower.includes('screed')) {
        categoryId = 4;
      } else if (lower.includes('ac') || lower.includes('hvac') || lower.includes('condition')) {
        categoryId = 5;
      } else if (lower.includes('paint') || lower.includes('pop')) {
        categoryId = 6;
      } else {
        categoryId = 2; // Default to Plumbing & Pipefitting
      }
    } else if (!categoryId) {
      categoryId = 2;
    }

    // Parse state and lgaCity accurately from location string (handling multi-segment Nigerian addresses)
    let state = payload.state;
    let lgaCity = payload.lgaCity;
    if (!state || !lgaCity) {
      const loc = (payload.location || 'Lagos').trim();
      const parts = loc.split(',').map((p) => p.trim()).filter(Boolean);
      if (parts.length === 1) {
        lgaCity = lgaCity || parts[0];
        state = state || 'Lagos';
      } else if (parts.length === 2) {
        lgaCity = lgaCity || parts[0];
        state = state || parts[1];
      } else if (parts.length >= 3) {
        // e.g. "14 Admiralty Way, Lekki Phase 1, Lagos" -> state is last, LGA/City is second-to-last
        state = state || parts[parts.length - 1];
        lgaCity = lgaCity || parts[parts.length - 2];
      }
    }

    const budgetMin = Number(payload.budgetMin ?? payload.budget ?? 1000);
    const budgetMax = Number(payload.budgetMax ?? payload.budget ?? 1000);

    const body: Record<string, unknown> = {
      categoryId,
      title: payload.title.trim(),
      description: payload.description.trim(),
      budgetType: payload.budgetType || 'FIXED',
      budgetMin,
      budgetMax,
      state: state || 'Lagos',
      lgaCity: lgaCity || 'Lagos',
      address: payload.address || payload.location,
    };

    if (payload.latitude != null) body.latitude = payload.latitude;
    if (payload.longitude != null) body.longitude = payload.longitude;
    if (payload.expectedOutcome) body.expectedOutcome = payload.expectedOutcome;
    if (payload.materialsProvidedBy) body.materialsProvidedBy = payload.materialsProvidedBy;
    if (payload.completionProofReq) body.completionProofReq = payload.completionProofReq;
    if (payload.urgency) body.urgency = payload.urgency;
    if (payload.deadlineDate) body.deadlineDate = payload.deadlineDate;
    if (payload.attachments && payload.attachments.length > 0) {
      body.attachments = payload.attachments;
    }

    const response = await apiClient.post<ApiResponse<JobRecord | { job: JobRecord }>>('/jobs', body);
    const data = response.data.data;
    return ((data as any)?.id ? data : (data as any)?.job) as JobRecord;
  }

  static async update(id: string, payload: Partial<CreateJobPayload>): Promise<JobRecord> {
    const body: Record<string, unknown> = {};
    if (payload.title) body.title = payload.title.trim();
    if (payload.description) body.description = payload.description.trim();
    if (payload.categoryId) body.categoryId = payload.categoryId;
    if (payload.budgetMin != null) body.budgetMin = Number(payload.budgetMin);
    if (payload.budgetMax != null) body.budgetMax = Number(payload.budgetMax);
    if (payload.budgetType) body.budgetType = payload.budgetType;
    if (payload.urgency) body.urgency = payload.urgency;
    if (payload.state) body.state = payload.state;
    if (payload.lgaCity) body.lgaCity = payload.lgaCity;
    if (payload.address) body.address = payload.address;
    if (payload.latitude != null) body.latitude = payload.latitude;
    if (payload.longitude != null) body.longitude = payload.longitude;
    if (payload.deadlineDate != null) body.deadlineDate = payload.deadlineDate;
    if (payload.expectedOutcome != null) body.expectedOutcome = payload.expectedOutcome;
    if (payload.materialsProvidedBy != null) body.materialsProvidedBy = payload.materialsProvidedBy;
    if (payload.completionProofReq != null) body.completionProofReq = payload.completionProofReq;
    if (payload.attachments && payload.attachments.length > 0) {
      body.attachments = payload.attachments;
    }

    const response = await apiClient.patch<ApiResponse<JobRecord>>(`/jobs/${id}`, body);
    return response.data.data;
  }

  static async updateStatus(id: string, status: string): Promise<JobRecord> {
    const response = await apiClient.patch<ApiResponse<JobRecord>>(`/jobs/${id}/status`, { status });
    return response.data.data;
  }

  static async delete(id: string, reason?: string): Promise<void> {
    await apiClient.delete(`/jobs/${id}`, {
      data: reason ? { reason } : undefined,
    });
  }

  static async deleteAttachment(jobId: string, attachmentId: string): Promise<void> {
    await apiClient.delete(`/jobs/${jobId}/attachments/${attachmentId}`);
  }

  static async getSavedJobs(): Promise<JobRecord[]> {
    const response = await apiClient.get<ApiResponse<JobRecord[]>>('/jobs/saved');
    return response.data.data;
  }

  static async saveJob(id: string): Promise<void> {
    await apiClient.post(`/jobs/${id}/save`);
  }

  static async unsaveJob(id: string): Promise<void> {
    await apiClient.delete(`/jobs/${id}/save`);
  }

  static async inviteArtisan(jobId: string, artisanId: string, message?: string): Promise<void> {
    await apiClient.post(`/jobs/${jobId}/invite/${artisanId}`, { message });
  }

  static async getMyInvitations(): Promise<JobInvitationRecord[]> {
    const response = await apiClient.get<ApiResponse<JobInvitationRecord[]>>('/jobs/invitations/my-invitations');
    return response.data.data;
  }

  static async respondInvitation(invitationId: string, status: 'ACCEPTED' | 'DECLINED'): Promise<void> {
    await apiClient.patch(`/jobs/invitations/${invitationId}/respond`, { status });
  }

  static async cancelInvitation(invitationId: string): Promise<void> {
    await apiClient.delete(`/jobs/invitations/${invitationId}`);
  }

  static async getCheckInToken(jobId: string): Promise<{
    jobId: string;
    token: string;
    qrPayload: string;
    expiresAt: string;
    location: {
      latitude: number;
      longitude: number;
      address: string;
    };
  }> {
    const response = await apiClient.get<ApiResponse<{
      jobId: string;
      token: string;
      qrPayload: string;
      expiresAt: string;
      location: {
        latitude: number;
        longitude: number;
        address: string;
      };
    }>>(`/jobs/${jobId}/checkin-qr`);
    return response.data.data;
  }

  static async verifyArrival(
    jobId: string,
    token: string,
    coords: { latitude: number; longitude: number }
  ): Promise<{
    verified: boolean;
    jobId: string;
    distanceMeters: number;
    verifiedAt: string;
    pointsAwarded?: number;
    message?: string;
  }> {
    const response = await apiClient.post<ApiResponse<{
      verified: boolean;
      jobId: string;
      distanceMeters: number;
      verifiedAt: string;
      pointsAwarded?: number;
      message?: string;
    }>>(`/jobs/${jobId}/verify-arrival`, {
      token,
      latitude: coords.latitude,
      longitude: coords.longitude,
    });
    return response.data.data;
  }
}

