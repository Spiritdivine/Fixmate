import { apiClient } from '../lib/api-client';
import { ApiResponse, ContractRecord } from '../types/api-contracts';

export interface CreateContractPayload {
  jobId: string;
  proposalId: string;
  title: string;
  totalAmount: number;
  milestones: Array<{
    title: string;
    amount: number;
    dueDate?: string;
  }>;
}

/**
 * ContractService (SRP):
 * Manages institutional master service agreements between clients and artisans.
 */
export class ContractService {
  static async getMyContracts(role?: 'CLIENT' | 'ARTISAN'): Promise<ContractRecord[]> {
    const response = await apiClient.get<ApiResponse<ContractRecord[]>>('/contracts', {
      params: role ? { role } : undefined,
    });
    return response.data.data;
  }

  static async getById(id: string): Promise<ContractRecord> {
    const response = await apiClient.get<ApiResponse<ContractRecord>>(`/contracts/${id}`);
    return response.data.data;
  }

  static async create(payload: CreateContractPayload): Promise<ContractRecord> {
    const response = await apiClient.post<ApiResponse<ContractRecord>>('/contracts', payload);
    return response.data.data;
  }

  static async cancel(id: string, reason?: string): Promise<ContractRecord> {
    const response = await apiClient.patch<ApiResponse<ContractRecord>>(`/contracts/${id}/cancel`, { reason });
    return response.data.data;
  }
}
