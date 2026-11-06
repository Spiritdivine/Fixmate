import { apiClient } from '../lib/api-client';
import { ApiResponse } from '../types/api-contracts';

export interface PeerArtisan {
  id: string;
  userId?: string;
  fullName: string;
  trade: string;
  rating: number;
  completedJobs: number;
  locationCity: string;
  distanceKm: number;
  avatarUrl?: string;
  isKycVerified: boolean;
  isAvailableForSubcontract: boolean;
  phone?: string;
}

export interface PeerDirectoryResponse {
  peers: PeerArtisan[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface JobSubcontract {
  id: string;
  contractId: string;
  primeArtisanId: string;
  subArtisanId: string;
  title: string;
  scope: string;
  agreedAmount: number;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  completionNotes?: string;
  createdAt: string;
  updatedAt: string;
  contract?: {
    id: string;
    contractCode: string;
    status: string;
  };
  primeArtisan?: {
    id: string;
    firstName?: string;
    lastName?: string;
    businessName?: string;
    user?: { phoneNumber?: string };
  };
  subArtisan?: {
    id: string;
    firstName?: string;
    lastName?: string;
    businessName?: string;
    user?: { phoneNumber?: string };
  };
}

export class PeerService {
  /**
   * Fetch peer artisans directory with proximity, trade filtering, and search
   */
  static async getPeerDirectory(params: {
    search?: string;
    trade?: string;
    lat?: number;
    lng?: number;
    page?: number;
    limit?: number;
  } = {}): Promise<PeerDirectoryResponse> {
    const response = await apiClient.get<ApiResponse<PeerDirectoryResponse>>('/peers/directory', {
      params,
    });
    return response.data?.data || { peers: [], meta: { total: 0, page: 1, limit: 30, totalPages: 0 } };
  }

  /**
   * Propose a subcontract assignment to a peer artisan
   */
  static async createSubcontract(payload: {
    contractId: string;
    subArtisanId: string;
    title: string;
    scope: string;
    agreedAmount: number;
  }): Promise<JobSubcontract> {
    const response = await apiClient.post<ApiResponse<JobSubcontract>>('/peers/subcontracts', payload);
    return response.data.data;
  }

  /**
   * Get user's active subcontracts (prime & assigned)
   */
  static async getMySubcontracts(): Promise<{ prime: JobSubcontract[]; assigned: JobSubcontract[] }> {
    const response = await apiClient.get<ApiResponse<{ prime: JobSubcontract[]; assigned: JobSubcontract[] }>>(
      '/peers/subcontracts'
    );
    return response.data?.data || { prime: [], assigned: [] };
  }

  /**
   * Update subcontract assignment status
   */
  static async updateSubcontractStatus(
    id: string,
    status: 'ACCEPTED' | 'DECLINED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED',
    completionNotes?: string
  ): Promise<JobSubcontract> {
    const response = await apiClient.patch<ApiResponse<JobSubcontract>>(`/peers/subcontracts/${id}/status`, {
      status,
      completionNotes,
    });
    return response.data.data;
  }
}
