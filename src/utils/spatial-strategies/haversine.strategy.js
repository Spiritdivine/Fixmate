import { Prisma } from '@prisma/client';
import { ISpatialDistanceStrategy } from './spatial-strategy.interface.js';

/**
 * Haversine distance strategy.
 * Provides high numerical precision even for extremely small distances.
 */
export class HaversineStrategy extends ISpatialDistanceStrategy {
  /**
   * @param {number} earthRadiusKm - Earth's mean volumetric radius in km (default: 6371.0088)
   */
  constructor(earthRadiusKm = 6371.0088) {
    super();
    this.earthRadiusKm = earthRadiusKm;
  }

  /**
   * Generates a parameterized SQL expression calculating Haversine distance in km.
   *
   * @param {number} clientLat
   * @param {number} clientLng
   * @returns {import('@prisma/client').Prisma.Sql}
   */
  getSqlDistanceExpression(clientLat, clientLng) {
    const lat = Number(clientLat);
    const lng = Number(clientLng);
    return Prisma.sql`(
      2 * ${this.earthRadiusKm}::float * asin(
        sqrt(
          power(sin(radians((ap.latitude::float - ${lat}::float) / 2)), 2) +
          cos(radians(${lat}::float)) *
          cos(radians(ap.latitude::float)) *
          power(sin(radians((ap.longitude::float - ${lng}::float) / 2)), 2)
        )
      )
    )`;
  }

  /**
   * In-memory calculation using the Haversine equation.
   *
   * @param {number} lat1
   * @param {number} lon1
   * @param {number} lat2
   * @param {number} lon2
   * @returns {number} distance in km
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const phi1 = toRad(lat1);
    const phi2 = toRad(lat2);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return this.earthRadiusKm * c;
  }
}
