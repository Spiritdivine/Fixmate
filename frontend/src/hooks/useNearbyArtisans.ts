import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import { ApiResponse, NearbyArtisansResponse } from '../types';

export interface ViewportBoundingBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export interface UseNearbyArtisansParams {
  lat?: number;
  lng?: number;
  radius?: number;
  bbox?: ViewportBoundingBox | null;
  categoryId?: string | number;
  minRating?: string | number;
  search?: string;
  isAvailable?: boolean;
  enabled?: boolean;
}

export function useNearbyArtisans({
  lat,
  lng,
  radius = 15,
  bbox,
  categoryId,
  minRating,
  search,
  isAvailable = true,
  enabled = true,
}: UseNearbyArtisansParams) {
  const queryKey = [
    'nearby-artisans',
    lat ?? '',
    lng ?? '',
    radius ?? '',
    bbox ? `${bbox.minLat.toFixed(3)}_${bbox.maxLat.toFixed(3)}_${bbox.minLng.toFixed(3)}_${bbox.maxLng.toFixed(3)}` : 'radial',
    categoryId || '',
    minRating || '',
    search || '',
    isAvailable,
  ];

  const hasValidCoordinates = (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) || Boolean(bbox);

  return useQuery<NearbyArtisansResponse>({
    queryKey,
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams();

      if (lat !== undefined && lng !== undefined) {
        params.append('lat', String(lat));
        params.append('lng', String(lng));
      }

      if (bbox) {
        params.append('minLat', String(bbox.minLat));
        params.append('maxLat', String(bbox.maxLat));
        params.append('minLng', String(bbox.minLng));
        params.append('maxLng', String(bbox.maxLng));
      } else if (radius) {
        params.append('radius', String(radius));
      }

      if (categoryId) params.append('categoryId', String(categoryId));
      if (minRating) params.append('minRating', String(minRating));
      if (search && search.trim()) params.append('search', search.trim());
      if (isAvailable != null) params.append('isAvailable', String(isAvailable));

      const { data } = await apiClient.get<ApiResponse<NearbyArtisansResponse>>(
        `/profiles/artisans/nearby?${params.toString()}`,
        { signal }
      );

      return data.data;
    },
    enabled: enabled && hasValidCoordinates,
    staleTime: 30000, // 30 seconds fresh
    refetchOnWindowFocus: false,
  });
}
