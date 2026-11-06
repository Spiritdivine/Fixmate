import { apiClient } from '../lib/api-client';
import {
  ApiResponse,
  ClientProfileData,
  ArtisanProfileData,
  PortfolioItem,
} from '../types/api-contracts';

export interface NearbyArtisansQuery {
  lat: number;
  lng: number;
  radiusKm?: number;
  trade?: string;
  limit?: number;
}

export interface ListArtisansQuery {
  trade?: string;
  minRating?: number;
  sortBy?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface KycSubmissionPayload {
  documentType: 'NIN' | 'BVN' | 'DRIVERS_LICENSE' | 'PASSPORT' | 'NATIONAL_ID';
  documentNumber: string;
  documentUrl: string;
  selfieUrl: string;
}

/**
 * ProfileService (SRP):
 * Manages user identities, trade profiles, GPS geocoding, KYC submissions,
 * and portfolio showcases.
 */
export class ProfileService {
  static async getNearbyArtisans(query: NearbyArtisansQuery): Promise<ArtisanProfileData[]> {
    const response = await apiClient.get<ApiResponse<ArtisanProfileData[]>>('/profiles/artisans/nearby', {
      params: query,
    });
    return response.data.data;
  }

  static async listArtisans(query: ListArtisansQuery = {}): Promise<ArtisanProfileData[]> {
    const response = await apiClient.get<ApiResponse<ArtisanProfileData[]>>('/profiles/artisans', {
      params: query,
    });
    return response.data.data;
  }

  static async getArtisanDetails(id: string): Promise<ArtisanProfileData> {
    const response = await apiClient.get<ApiResponse<ArtisanProfileData>>(`/profiles/artisans/${id}`);
    return response.data.data;
  }

  static async updateClient(payload: Partial<ClientProfileData>): Promise<ClientProfileData> {
    const response = await apiClient.patch<ApiResponse<ClientProfileData>>('/profiles/client', payload);
    return response.data.data;
  }

  static async updateAvatar(avatarUrl: string): Promise<{ id: string; email: string; avatarUrl: string }> {
    const response = await apiClient.patch<ApiResponse<{ id: string; email: string; avatarUrl: string }>>('/profiles/avatar', {
      avatarUrl,
    });
    return response.data.data;
  }

  static async updateArtisan(payload: Partial<ArtisanProfileData>): Promise<ArtisanProfileData> {
    const response = await apiClient.patch<ApiResponse<ArtisanProfileData>>('/profiles/artisan', payload);
    return response.data.data;
  }

  static async toggleAvailability(isAvailable: boolean): Promise<{ isAvailable: boolean }> {
    const response = await apiClient.patch<ApiResponse<{ isAvailable: boolean }>>(
      '/profiles/artisan/availability',
      { isAvailable }
    );
    return response.data.data;
  }

  static async updateLocation(latitude: number, longitude: number): Promise<void> {
    await apiClient.patch('/profiles/artisan/location', { latitude, longitude });
  }

  static async addPortfolio(item: Omit<PortfolioItem, 'id'>): Promise<PortfolioItem> {
    const response = await apiClient.post<ApiResponse<PortfolioItem>>('/profiles/artisan/portfolio', item);
    return response.data.data;
  }

  static async updatePortfolio(id: string, item: Partial<PortfolioItem>): Promise<PortfolioItem> {
    const response = await apiClient.patch<ApiResponse<PortfolioItem>>(`/profiles/artisan/portfolio/${id}`, item);
    return response.data.data;
  }

  static async deletePortfolio(id: string): Promise<void> {
    await apiClient.delete(`/profiles/artisan/portfolio/${id}`);
  }

  static async submitKyc(payload: KycSubmissionPayload): Promise<{ status: string }> {
    const response = await apiClient.post<ApiResponse<{ status: string }>>('/profiles/kyc', payload);
    return response.data.data;
  }

  static async getSavedArtisans(): Promise<ArtisanProfileData[]> {
    const response = await apiClient.get<ApiResponse<ArtisanProfileData[]>>('/profiles/saved-artisans');
    return response.data.data;
  }

  static async saveArtisan(id: string): Promise<void> {
    await apiClient.post(`/profiles/artisans/${id}/save`);
  }

  static async unsaveArtisan(id: string): Promise<void> {
    await apiClient.delete(`/profiles/artisans/${id}/save`);
  }

  static async getArtisanSkills(): Promise<any[]> {
    const response = await apiClient.get<ApiResponse<any[]>>('/profiles/artisan/skills');
    return response.data.data;
  }

  static async addArtisanSkill(skillId: number): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>('/profiles/artisan/skills', { skillId });
    return response.data.data;
  }

  static async removeArtisanSkill(skillId: number): Promise<void> {
    await apiClient.delete(`/profiles/artisan/skills/${skillId}`);
  }
}
