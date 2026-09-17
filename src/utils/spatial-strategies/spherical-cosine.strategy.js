import { Prisma } from '@prisma/client';
import { ISpatialDistanceStrategy } from './spatial-strategy.interface.js';

/**
 * Spherical Law of Cosines distance strategy.
 * Highly optimized for database SQL execution with defensive numeric clamping
 * to prevent floating-point precision overflow (NaN protection in acos).
 */
export class SphericalCosineStrategy extends ISpatialDistanceStrategy {
  /**
   * @param {number} earthRadiusKm - Earth's mean volumetric radius in km (default: 6371.0088)
   */
  constructor(earthRadiusKm = 6371.0088) {
    super();
    this.earthRadiusKm = earthRadiusKm;
  }

  /**
   * Generates a parameterized SQL expression calculating spherical distance in km.
   * Uses LEAST(1.0, GREATEST(-1.0, ...)) to ensure the argument to acos is always within [-1, 1].
   *
   * @param {number} clientLat
   * @param {number} clientLng
   * @returns {import('@prisma/client').Prisma.Sql}
   */
  getSqlDistanceExpression(clientLat, clientLng) {
    const lat = Number(clientLat);
    const lng = Number(clientLng);
    return Prisma.sql`(
      ${this.earthRadiusKm}::float * acos(
        LEAST(1.0::float, GREATEST(-1.0::float,
          sin(radians(${lat}::float)) * sin(radians(ap.latitude::float)) +
          cos(radians(${lat}::float)) * cos(radians(ap.latitude::float)) *
          cos(radians(ap.longitude::float) - radians(${lng}::float))
        ))
      )
    )`;
  }

  /**
   * In-memory calculation using Spherical Law of Cosines.
   *
   * @param {number} lat1
   * @param {number} lon1
   * @param {number} lat2
   * @param {number} lon2
   * @returns {number} distance in km
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const phi1 = toRad(lat1);
    const phi2 = toRad(lat2);
    const deltaLambda = toRad(lon2 - lon1);

    const cosAngle =
      Math.sin(phi1) * Math.sin(phi2) + Math.cos(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
    const clampedCos = Math.max(-1, Math.min(1, cosAngle));
    return this.earthRadiusKm * Math.acos(clampedCos);
  }
}
