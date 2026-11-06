import { Platform } from 'react-native';
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

    if (Platform.OS === 'web') {
      try {
        const fetchRes = await fetch(uri);
        const blob = await fetchRes.blob();
        formData.append('file', blob, fileName);
      } catch (blobErr) {
        // Fallback for base64 or remote uri
        formData.append('file', {
          uri,
          name: fileName,
          type: mimeType,
        } as unknown as Blob);
      }
    } else {
      // Standard React Native FormData file specification on iOS / Android
      formData.append('file', {
        uri,
        name: fileName,
        type: mimeType,
      } as unknown as Blob);
    }

    formData.append('folder', folder);

    // Let the network adapter generate the boundary parameter automatically
    const response = await apiClient.post<ApiResponse<UploadResult>>('/upload/single', formData, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.data?.data?.url) {
      throw new Error('Upload succeeded but server did not return a valid file URL.');
    }

    return response.data.data.url;
  }
}
