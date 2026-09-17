import crypto from 'crypto';
import { HaversineStrategy } from './spatial-strategies/haversine.strategy.js';

const defaultHaversine = new HaversineStrategy();
const KM_PER_LAT_DEGREE = 111.045;

/**
 * Domain Geolocation Utilities
 * Stateless, pure functions for geodesic boundary calculations,
 * privacy geofuzzing, coordinate validation, and distance formatting.
 */
export class GeoUtils {
  /**
   * Calculates a bounding box (lat/lng envelope) around a center coordinate given a radius in km.
   * Accounts for longitude meridional convergence as latitude deviates from the equator.
   *
   * @param {number} latitude - Center latitude in degrees [-90, 90]
   * @param {number} longitude - Center longitude in degrees [-180, 180]
   * @param {number} radiusKm - Radius in kilometers
   * @returns {{ minLat: number, maxLat: number, minLng: number, maxLng: number }}
   */
  static getBoundingBox(latitude, longitude, radiusKm) {
    const lat = Number(latitude);
    const lng = Number(longitude);
    const rad = Number(radiusKm);

    const latDelta = rad / KM_PER_LAT_DEGREE;

    // Handle polar edge cases where cos(latitude) approaches 0
    const cosLat = Math.cos((lat * Math.PI) / 180);
    const lngDivisor = KM_PER_LAT_DEGREE * Math.abs(cosLat);
    const lngDelta = lngDivisor > 0.0001 ? rad / lngDivisor : 180;

    return {
      minLat: Math.max(-90, lat - latDelta),
      maxLat: Math.min(90, lat + latDelta),
      minLng: Math.max(-180, lng - lngDelta),
      maxLng: Math.min(180, lng + lngDelta),
    };
  }

  /**
   * Deterministically obfuscates a coordinate pair by a random offset (150m - 300m)
   * seeded by the entity ID (e.g. artisan profile UUID).
   *
   * Ensures:
   * 1. Public discovery map does not expose the artisan's exact residential coordinates.
   * 2. The obfuscation is stable/deterministic per artisan (pins don't bounce around on reload).
   *
   * @param {number|null} latitude
   * @param {number|null} longitude
   * @param {string} entityId - Stable seed (e.g. UUID)
   * @param {number} [minMeters=150]
   * @param {number} [maxMeters=300]
   * @returns {{ fuzzedLat: number|null, fuzzedLng: number|null, isFuzzed: boolean }}
   */
  static fuzzCoordinates(latitude, longitude, entityId, minMeters = 150, maxMeters = 300) {
    if (latitude == null || longitude == null) {
      return { fuzzedLat: null, fuzzedLng: null, isFuzzed: false };
    }

    const numLat = Number(latitude);
    const numLng = Number(longitude);

    if (isNaN(numLat) || isNaN(numLng)) {
      return { fuzzedLat: null, fuzzedLng: null, isFuzzed: false };
    }

    // Generate deterministic 32-bit pseudo-random numbers from entityId SHA-256 hash
    const hash = crypto.createHash('sha256').update(String(entityId || 'salt_key')).digest('hex');
    const seedAngle = parseInt(hash.substring(0, 8), 16);
    const seedDistance = parseInt(hash.substring(8, 16), 16);

    const angle = (seedAngle % 360) * (Math.PI / 180);
    const distanceMeters = minMeters + (seedDistance % (maxMeters - minMeters + 1));

    const deltaLat = (distanceMeters / 1000) / KM_PER_LAT_DEGREE;
    const cosLat = Math.cos((numLat * Math.PI) / 180);
    const lngDivisor = KM_PER_LAT_DEGREE * (Math.abs(cosLat) > 0.0001 ? Math.abs(cosLat) : 1);
    const deltaLng = (distanceMeters / 1000) / lngDivisor;

    const fuzzedLat = Number((numLat + deltaLat * Math.cos(angle)).toFixed(6));
    const fuzzedLng = Number((numLng + deltaLng * Math.sin(angle)).toFixed(6));

    return {
      fuzzedLat,
      fuzzedLng,
      isFuzzed: true,
    };
  }

  /**
   * Formats distance in km to 1 decimal place.
   *
   * @param {number} distanceKm
   * @returns {number}
   */
  static formatDistance(distanceKm) {
    if (distanceKm == null || isNaN(distanceKm)) return 0;
    return Math.round(Number(distanceKm) * 10) / 10;
  }

  /**
   * Convenience calculation of distance in km between two coordinate pairs.
   *
   * @param {number} lat1
   * @param {number} lon1
   * @param {number} lat2
   * @param {number} lon2
   * @returns {number}
   */
  static calculateDistance(lat1, lon1, lat2, lon2) {
    return defaultHaversine.calculateDistance(lat1, lon1, lat2, lon2);
  }
}
