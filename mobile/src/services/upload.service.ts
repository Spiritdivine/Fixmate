import { apiClient } from '../lib/api-client';
import { ApiResponse } from '../types/api-contracts';

export interface UploadResult {
  url: string;
  publicId?: string;
  bytes?: number;
  format?: string;
}

export type UploadFolder = 'avatars' | 'jobs' | 'proofs' | 'kyc_documents' | 'chat';

/**
 * UploadService (SRP):
 * Manages multipart form-data transmissions to Express /upload/single endpoint.
 */
export class UploadService {
  static async uploadImage(
    uri: string,
    folder: UploadFolder = 'jobs',
    fileName = 'upload.jpg',
    mimeType = 'image/jpeg'
  ): Promise<string> {
    const formData = new FormData();

    // Standard React Native FormData file specification
    formData.append('file', {
      uri,
      name: fileName,
      type: mimeType,
    } as unknown as Blob);

    formData.append('folder', folder);

    const response = await apiClient.post<ApiResponse<UploadResult>>('/upload/single', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data.url;
  }
}
