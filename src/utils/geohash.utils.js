/**
 * Geohash Utility Module
 * Implements standard Base32 Geohash encoding and decoding algorithms
 * for spatial quantization and high-speed cache grid bucketing.
 */

const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

export class GeohashUtils {
  /**
   * Encodes latitude and longitude into a geohash string.
   * Precision determines the bounding box dimensions:
   *   Precision 5: ~4.9km x 4.9km
   *   Precision 6: ~1.2km x 0.61km (ideal for local artisan spatial cache)
   *   Precision 7: ~153m x 153m
   *
   * @param {number} latitude
   * @param {number} longitude
   * @param {number} precision (default 6)
   * @returns {string} geohash
   */
  static encode(latitude, longitude, precision = 6) {
    const lat = Number(latitude);
    const lng = Number(longitude);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new Error(`Invalid coordinates for geohash encoding: lat=${latitude}, lng=${longitude}`);
    }

    let isEven = true;
    let bit = 0;
    let ch = 0;
    let geohash = '';

    let latMin = -90.0;
    let latMax = 90.0;
    let lngMin = -180.0;
    let lngMax = 180.0;

    while (geohash.length < precision) {
      if (isEven) {
        const mid = (lngMin + lngMax) / 2;
        if (lng >= mid) {
          ch |= 1 << (4 - bit);
          lngMin = mid;
        } else {
          lngMax = mid;
        }
      } else {
        const mid = (latMin + latMax) / 2;
        if (lat >= mid) {
          ch |= 1 << (4 - bit);
          latMin = mid;
        } else {
          latMax = mid;
        }
      }

      isEven = !isEven;
      if (bit < 4) {
        bit++;
      } else {
        geohash += BASE32[ch];
        bit = 0;
        ch = 0;
      }
    }

    return geohash;
  }

  /**
   * Decodes a geohash string into latitude and longitude center bounds.
   *
   * @param {string} geohash
   * @returns {{ latitude: number, longitude: number, error: { lat: number, lng: number } }}
   */
  static decode(geohash) {
    let isEven = true;
    let latMin = -90.0;
    let latMax = 90.0;
    let lngMin = -180.0;
    let lngMax = 180.0;

    for (let i = 0; i < geohash.length; i++) {
      const c = geohash[i].toLowerCase();
      const cd = BASE32.indexOf(c);
      if (cd === -1) {
        throw new Error(`Invalid geohash character: ${c}`);
      }

      for (let j = 0; j < 5; j++) {
        const mask = 1 << (4 - j);
        if (isEven) {
          const mid = (lngMin + lngMax) / 2;
          if ((cd & mask) !== 0) {
            lngMin = mid;
          } else {
            lngMax = mid;
          }
        } else {
          const mid = (latMin + latMax) / 2;
          if ((cd & mask) !== 0) {
            latMin = mid;
          } else {
            latMax = mid;
          }
        }
        isEven = !isEven;
      }
    }

    const latitude = (latMin + latMax) / 2;
    const longitude = (lngMin + lngMax) / 2;

    return {
      latitude,
      longitude,
      error: {
        lat: (latMax - latMin) / 2,
        lng: (lngMax - lngMin) / 2,
      },
    };
  }
}
