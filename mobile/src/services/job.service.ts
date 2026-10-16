import { apiClient } from '../lib/api-client';
import { ApiResponse, JobRecord, BudgetType, JobUrgency } from '../types/api-contracts';

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
  attachments?: Array<{ fileUrl: string; fileName: string; fileSizeBytes: number; mimeType: string }>;
}

export interface JobListQuery {
  trade?: string;
  status?: string;
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
    const response = await apiClient.get<ApiResponse<JobRecord[]>>('/jobs', { params: query });
    return response.data.data;
  }

  static async getMyJobs(status?: string): Promise<JobRecord[]> {
    const response = await apiClient.get<ApiResponse<JobRecord[]>>('/jobs/my-jobs', {
      params: status ? { status } : undefined,
    });
    return response.data.data;
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

    // Parse state and lgaCity from location string if not explicitly given
    let state = payload.state;
    let lgaCity = payload.lgaCity;
    if (!state || !lgaCity) {
      const loc = (payload.location || 'Lagos').trim();
      const parts = loc.split(',').map((p) => p.trim());
      if (parts.length >= 2) {
        lgaCity = lgaCity || parts[0];
        state = state || parts[1];
      } else {
        lgaCity = lgaCity || loc || 'Lekki';
        state = state || 'Lagos';
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
      state,
      lgaCity,
      address: payload.address || payload.location,
    };

    if (payload.latitude != null) body.latitude = payload.latitude;
    if (payload.longitude != null) body.longitude = payload.longitude;
    if (payload.attachments && payload.attachments.length > 0) {
      body.attachments = payload.attachments;
    }

    const response = await apiClient.post<ApiResponse<JobRecord | { job: JobRecord }>>('/jobs', body);
    const data = response.data.data;
    return ((data as any)?.id ? data : (data as any)?.job) as JobRecord;
  }

  static async updateStatus(id: string, status: string): Promise<JobRecord> {
    const response = await apiClient.patch<ApiResponse<JobRecord>>(`/jobs/${id}/status`, { status });
    return response.data.data;
  }

  static async delete(id: string): Promise<void> {
    await apiClient.delete(`/jobs/${id}`);
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
}
