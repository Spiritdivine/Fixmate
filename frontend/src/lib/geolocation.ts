/**
 * Geolocation Service Module
 * Handles HTML5 Geolocation API interactions, permission checks, timeouts,
 * and reliable Nigerian regional default coordinates (Ikeja, Lagos).
 */

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export type GeolocationPermissionState = 'prompt' | 'granted' | 'denied' | 'unsupported';

export interface GeolocationResult {
  coordinates: GeoCoordinates;
  isFallback: boolean;
  permissionState: GeolocationPermissionState;
  error?: string;
}

/**
 * Default fallback coordinates: Ikeja, Lagos, Nigeria
 * Used when GPS is unavailable, permission is denied, or running on non-secure context.
 */
export const DEFAULT_NIGERIAN_COORDINATES: GeoCoordinates = {
  latitude: 6.5952,
  longitude: 3.3512,
  accuracy: 1000,
};

export class GeolocationService {
  /**
   * Queries the browser Permissions API if available.
   */
  static async checkPermission(): Promise<GeolocationPermissionState> {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      return 'unsupported';
    }

    if (!('permissions' in navigator)) {
      return 'prompt';
    }

    try {
      const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      return status.state as GeolocationPermissionState;
    } catch {
      return 'prompt';
    }
  }

  /**
   * Retrieves high-accuracy coordinates with timeout guard and fallback.
   *
   * @param {PositionOptions} [options]
   * @returns {Promise<GeolocationResult>}
   */
  static async getCurrentPosition(options?: PositionOptions): Promise<GeolocationResult> {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      return {
        coordinates: DEFAULT_NIGERIAN_COORDINATES,
        isFallback: true,
        permissionState: 'unsupported',
        error: 'Geolocation is not supported by this browser.',
      };
    }

    const defaultOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 8000, // 8 seconds timeout guard
      maximumAge: 60000, // 1 minute cached position
      ...options,
    };

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            coordinates: {
              latitude: Number(position.coords.latitude.toFixed(6)),
              longitude: Number(position.coords.longitude.toFixed(6)),
              accuracy: position.coords.accuracy,
            },
            isFallback: false,
            permissionState: 'granted',
          });
        },
        (err) => {
          let errorMessage = 'Unable to retrieve location coordinates.';
          let permissionState: GeolocationPermissionState = 'prompt';

          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorMessage = 'Location access permission was denied. Defaulting to Lagos.';
              permissionState = 'denied';
              break;
            case err.POSITION_UNAVAILABLE:
              errorMessage = 'Location signal unavailable. Defaulting to Lagos.';
              break;
            case err.TIMEOUT:
              errorMessage = 'Location request timed out. Defaulting to Lagos.';
              break;
          }

          resolve({
            coordinates: DEFAULT_NIGERIAN_COORDINATES,
            isFallback: true,
            permissionState,
            error: errorMessage,
          });
        },
        defaultOptions
      );
    });
  }
}
