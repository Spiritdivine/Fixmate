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

  private static cachedLocation: GeoCoordinate | null = null;
  private static cacheTimestamp: number = 0;
  private static inFlightPromise: Promise<GeoCoordinate> | null = null;
  private static CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache retention

  /**
   * Returns the synchronously available cached location or default fallback.
   */
  static getCachedLocation(): GeoCoordinate {
    return this.cachedLocation || this.defaultLocation;
  }

  /**
   * Round coordinate to 3 decimal places (~110m) to prevent micro-GPS jitter from invalidating query keys
   */
  static roundCoord(coord: number): number {
    return Math.round(coord * 1000) / 1000;
  }

  /**
   * 4-Tier Location Acquisition Cascade with In-Memory Caching & Deduplication:
   * 0. Fast-path: Return fresh in-memory cached location (<10 min old) in 0ms
   * 1. Fast-path: Check device's last known position (<100ms)
   * 2. Real-time GPS via Expo Location (with 3-second timeout guard)
   * 3. Backend IP-based Geolocation & Profile resolver (/api/v1/ai/detect-ip-location)
   * 4. Default Regional Nigerian Anchor (Ikeja, Lagos)
   */
  static async getCurrentLocation(forceRefresh = false): Promise<GeoCoordinate> {
    const now = Date.now();

    // Fast-path: Serve from in-memory cache if within TTL
    if (!forceRefresh && this.cachedLocation && now - this.cacheTimestamp < this.CACHE_TTL_MS) {
      return this.cachedLocation;
    }

    // Deduplicate concurrent in-flight requests
    if (this.inFlightPromise) {
      return this.inFlightPromise;
    }

    this.inFlightPromise = (async () => {
      try {
        const resolved = await this.acquireLocationCascade(forceRefresh);
        this.cachedLocation = resolved;
        this.cacheTimestamp = Date.now();
        return resolved;
      } finally {
        this.inFlightPromise = null;
      }
    })();

    return this.inFlightPromise;
  }

  private static async acquireLocationCascade(forceRefresh: boolean): Promise<GeoCoordinate> {
    try {
      // 1. Check foreground permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        // Tier 1 Fast-path: Check device's last known position
        if (!forceRefresh) {
          try {
            const lastKnown = await Location.getLastKnownPositionAsync();
            if (lastKnown && lastKnown.coords) {
              const roundedLat = this.roundCoord(lastKnown.coords.latitude);
              const roundedLng = this.roundCoord(lastKnown.coords.longitude);

              // Perform reverse geocode non-blocking or quickly
              let addressName = 'Detected Location';
              let city: string | undefined;
              let state: string | undefined;

              try {
                const [reversed] = await Location.reverseGeocodeAsync({
                  latitude: lastKnown.coords.latitude,
                  longitude: lastKnown.coords.longitude,
                });
                if (reversed) {
                  city = reversed.city || reversed.district || undefined;
                  state = reversed.region || undefined;
                  const parts = [reversed.street, city, state].filter(Boolean);
                  if (parts.length > 0) addressName = parts.join(', ');
                }
              } catch {
                // Ignore reverse geocode failures
              }

              return {
                latitude: roundedLat,
                longitude: roundedLng,
                accuracy: lastKnown.coords.accuracy || undefined,
                addressName,
                city,
                state,
                source: 'GPS',
              };
            }
          } catch {
            // Last known unavailable, proceed to active GPS
          }
        }

        // Tier 2: Real-time GPS with 3-second timeout guard
        try {
          const loc = await Promise.race([
            Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            }),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('GPS Timeout')), 3000)
            ),
          ]);

          const roundedLat = this.roundCoord(loc.coords.latitude);
          const roundedLng = this.roundCoord(loc.coords.longitude);

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
            latitude: roundedLat,
            longitude: roundedLng,
            accuracy: loc.coords.accuracy || undefined,
            addressName,
            city,
            state,
            source: 'GPS',
          };
        } catch {
          // GPS acquisition timed out or failed, continue to Tier 3
        }
      }

      // Tier 3: Query Backend IP & Profile Geolocation Fallback
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
            latitude: this.roundCoord(data.latitude),
            longitude: this.roundCoord(data.longitude),
            addressName: data.formattedAddress || `${data.city || 'Lagos'}, ${data.state || 'Lagos'}`,
            city: data.city,
            state: data.state,
            source: data.source || 'IP_GEOIP',
          };
        }
      } catch {
        // Backend IP lookup unavailable, continue to Tier 4
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
