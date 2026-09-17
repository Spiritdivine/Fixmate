/**
 * Interface contract for spatial distance strategies.
 * Defines methods required to compute distances both at the database level (SQL expression)
 * and in-memory (Node.js runtime).
 */
export class ISpatialDistanceStrategy {
  /**
   * Generates a parameterized Prisma SQL fragment calculating distance in kilometers.
   * Assumes the SQL context has an alias `ap` for artisan_profiles with `latitude` and `longitude` fields.
   *
   * @param {number} clientLat - Client's latitude
   * @param {number} clientLng - Client's longitude
   * @returns {import('@prisma/client').Prisma.Sql}
   */
  getSqlDistanceExpression(clientLat, clientLng) {
    throw new Error('Method getSqlDistanceExpression() must be implemented by concrete subclass.');
  }

  /**
   * Calculates the distance between two points in-memory.
   *
   * @param {number} lat1 - Latitude of point 1
   * @param {number} lon1 - Longitude of point 1
   * @param {number} lat2 - Latitude of point 2
   * @param {number} lon2 - Longitude of point 2
   * @returns {number} Distance in kilometers
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    throw new Error('Method calculateDistance() must be implemented by concrete subclass.');
  }
}
