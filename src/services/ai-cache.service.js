import crypto from 'crypto';

class DiagnosticCacheEngine {
  constructor() {
    this.cache = new Map();
    this.ttlMs = 48 * 60 * 60 * 1000; // 48 hours
    this.tokenStats = {
      totalCalls: 0,
      cacheHits: 0,
      cacheMisses: 0,
      estimatedTokensSaved: 0,
    };
  }

  /**
   * Compute normalized deterministic hash for symptom description
   * @param {string} prompt
   * @param {string} categorySlug
   * @param {string} locality
   */
  hashKey(prompt = '', categorySlug = '', locality = '') {
    const normalized = `${prompt.toLowerCase().trim().replace(/[^a-z0-9]/g, '')}_${categorySlug}_${locality}`;
    return crypto.createHash('sha256').update(normalized).digest('hex');
  }

  /**
   * Get cached diagnostic result
   */
  get(key) {
    this.tokenStats.totalCalls++;
    const entry = this.cache.get(key);
    if (!entry) {
      this.tokenStats.cacheMisses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.tokenStats.cacheMisses++;
      return null;
    }

    this.tokenStats.cacheHits++;
    this.tokenStats.estimatedTokensSaved += 1200; // Average prompt+response token size
    return entry.value;
  }

  /**
   * Set cached diagnostic result
   */
  set(key, value) {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  /**
   * Retrieve cache telemetry stats
   */
  getStats() {
    const hitRate =
      this.tokenStats.totalCalls > 0
        ? Number(((this.tokenStats.cacheHits / this.tokenStats.totalCalls) * 100).toFixed(1))
        : 0;

    return {
      ...this.tokenStats,
      hitRatePercent: hitRate,
      activeCachedEntries: this.cache.size,
    };
  }

  clear() {
    this.cache.clear();
  }
}

export const AiCacheService = new DiagnosticCacheEngine();
