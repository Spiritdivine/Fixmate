import * as Location from 'expo-location';
import { apiClient } from './api-client';

export interface GeoCoordinate {
  latitude: number;
  longitude: number;
  accuracy?: number;
  addressName?: string;
  city?: string;
  state?: string;
  source?: 'GPS' | 'PROFILE' | 'IP_GEOIP' | 'FALLBACK';
}

export class LocationProvider {
  private static defaultLocation: GeoCoordinate = {
    latitude: 6.5952,
    longitude: 3.3512,
    addressName: 'Ikeja, Lagos State',
    city: 'Ikeja',
    state: 'Lagos',
    source: 'FALLBACK',
  };

  /**
   * 4-Tier Location Acquisition Cascade:
   * Tier 1: Real-time GPS via Expo Location (with 5-second timeout guard)
   * Tier 2: Backend IP-based Geolocation & Profile resolver (/api/v1/ai/detect-ip-location)
   * Tier 3: Default Regional Nigerian Anchor (Ikeja, Lagos)
   */
  static async getCurrentLocation(): Promise<GeoCoordinate> {
    try {
      // 1. Request foreground permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        try {
          const loc = await Promise.race([
            Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            }),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('GPS Timeout')), 5000)
            ),
          ]);

          let addressName = 'Detected Location';
          let city: string | undefined;
          let state: string | undefined;

          try {
            const [reversed] = await Location.reverseGeocodeAsync({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            });

            if (reversed) {
              city = reversed.city || reversed.district || undefined;
              state = reversed.region || undefined;
              const parts = [reversed.street, city, state].filter(Boolean);
              if (parts.length > 0) {
                addressName = parts.join(', ');
              }
            }
          } catch {
            // Reverse geocode non-critical fallback
          }

          return {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            accuracy: loc.coords.accuracy || undefined,
            addressName,
            city,
            state,
            source: 'GPS',
          };
        } catch {
          // GPS acquisition timed out or failed, continue to Tier 2
        }
      }

      // Tier 2: Query Backend IP & Profile Geolocation Fallback
      try {
        const res = await apiClient.get<{
          data?: {
            city?: string;
            state?: string;
            formattedAddress?: string;
            latitude?: number;
            longitude?: number;
            source?: 'PROFILE' | 'IP_GEOIP';
          };
        }>('/ai/detect-ip-location');

        const data = res.data?.data;
        if (data && data.latitude && data.longitude) {
          return {
            latitude: data.latitude,
            longitude: data.longitude,
            addressName: data.formattedAddress || `${data.city || 'Lagos'}, ${data.state || 'Lagos'}`,
            city: data.city,
            state: data.state,
            source: data.source || 'IP_GEOIP',
          };
        }
      } catch {
        // Backend IP lookup unavailable, continue to Tier 3
      }

      return this.defaultLocation;
    } catch {
      return this.defaultLocation;
    }
  }

  static calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(1));
  }
}
