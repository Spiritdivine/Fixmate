/**
 * Spatial Cache Module
 * In-memory spatial grid cache using Geohash quantization with TTL eviction
 * and atomic invalidation to optimize high-concurrency discovery queries.
 */

import { GeohashUtils } from './geohash.utils.js';

export class SpatialCache {
  constructor(maxEntries = 500, ttlMs = 60000) {
    this.maxEntries = maxEntries;
    this.ttlMs = ttlMs;
    this.cache = new Map();
    this.stats = { hits: 0, misses: 0, sets: 0, invalidations: 0 };
  }

  /**
   * Generates a quantized cache key based on geohash precision 6, radius, and query filters.
   */
  generateKey(lat, lng, radius, filters = {}) {
    let spatialPrefix;
    if (lat !== undefined && lng !== undefined) {
      spatialPrefix = GeohashUtils.encode(lat, lng, 6);
    } else if (filters.minLat && filters.maxLat) {
      spatialPrefix = `bbox_${Number(filters.minLat).toFixed(3)}_${Number(filters.maxLat).toFixed(3)}_${Number(filters.minLng).toFixed(3)}_${Number(filters.maxLng).toFixed(3)}`;
    } else {
      spatialPrefix = 'global';
    }

    const categoryPart = filters.categoryId ? `_c${filters.categoryId}` : '';
    const skillPart = filters.skillId ? `_s${filters.skillId}` : '';
    const ratingPart = filters.minRating ? `_r${filters.minRating}` : '';
    const pagePart = filters.page ? `_p${filters.page}` : '';
    const radiusPart = radius ? `_rad${radius}` : '';

    return `spatial_${spatialPrefix}${radiusPart}${categoryPart}${skillPart}${ratingPart}${pagePart}`;
  }

  /**
   * Retrieves an item from cache if unexpired.
   */
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    const now = Date.now();
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Refresh LRU order
    this.cache.delete(key);
    this.cache.set(key, entry);
    this.stats.hits++;
    return entry.value;
  }

  /**
   * Caches a query result with automatic TTL.
   */
  set(key, value) {
    if (this.cache.size >= this.maxEntries) {
      // Evict oldest entry (first item in Map iterator)
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs,
    });
    this.stats.sets++;
  }

  /**
   * Invalidates all cache entries (e.g. on artisan location or availability updates).
   */
  invalidateAll() {
    this.cache.clear();
    this.stats.invalidations++;
  }

  getStats() {
    return {
      ...this.stats,
      size: this.cache.size,
      maxEntries: this.maxEntries,
      ttlMs: this.ttlMs,
    };
  }
}

// Singleton spatial cache instance
export const spatialCache = new SpatialCache(1000, 60000);
