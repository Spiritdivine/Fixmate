import crypto from 'crypto';
import { cacheStore, redis } from '../config/redis.js';

// Provider circuit-breaker tracking
const providerHealth = {
  openai: { failures: 0, lastFailure: null, isHealthy: true },
  gemini: { failures: 0, lastFailure: null, isHealthy: true },
};

const CIRCUIT_BREAKER_COOLDOWN_MS = 60000; // 1 minute cooldown after consecutive failures
const MAX_CONSECUTIVE_FAILURES = 3;

// Fast local memory cache for synchronous instant reads
const localMemoryMap = new Map();

export class AiCacheService {
  static PREFIX = 'artisan:ai_diag:symptom:';
  static DEFAULT_TTL_SECONDS = 172800; // 48 Hours

  /**
   * Normalizes client symptom text into a deterministic, order-invariant canonical representation.
   * Strips regional Nigerian dialect fillers and conversational noise words.
   *
   * @param {string} text
   * @returns {string}
   */
  static normalizeSymptomText(text) {
    if (!text || typeof text !== 'string') return '';

    // Stopwords, colloquial fillers, and non-diagnostic conversational fluff
    const fillerWords = new Set([
      'abeg', 'biko', 'dey', 'wetin', 'pls', 'please', 'help', 'sir',
      'ma', 'my', 'the', 'is', 'are', 'doing', 'since', 'yesterday',
      'today', 'now', 'just', 'started', 'been', 'having', 'issue',
      'wahala', 'kuku', 'sharp', 'bro', 'oga', 'john'
    ]);

    return text
      .toLowerCase()
      // Preserve decimal numbers (e.g., 1.5hp -> 1_5hp) so numbers are not stripped
      .replace(/(\d+)\.(\d+)/g, '$1_$2')
      .replace(/[^\w\s]/gi, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 1 && !fillerWords.has(word))
      .sort() // Order invariance: "ac warm air" === "warm air ac"
      .join(' ')
      .trim();
  }

  /**
   * Legacy and advanced hash key generator
   */
  static hashKey(textPrompt, category = '', locality = '') {
    const normalized = this.normalizeSymptomText(textPrompt);
    const raw = `${category || 'GENERIC'}:${locality || 'NG'}:${normalized}`;
    return `${this.PREFIX}${crypto.createHash('sha256').update(raw).digest('hex')}`;
  }

  /**
   * Generates a deterministic SHA-256 cache key for an AI diagnostic inquiry
   */
  static generateKey({ categoryId, categoryName, symptoms, locationZone = 'NG_DEFAULT' }) {
    return this.hashKey(symptoms, categoryId || categoryName, locationZone);
  }

  /**
   * Synchronous / Instant read wrapper (checks local map, background syncs with Redis)
   */
  static get(key) {
    if (!key) return null;
    const entry = localMemoryMap.get(key);
    if (entry) {
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        localMemoryMap.delete(key);
        return null;
      }
      return entry.data;
    }
    return null;
  }

  /**
   * Asynchronous Redis-backed cache retrieval
   */
  static async getAsync(key) {
    if (!key) return null;
    // Check local memory first (< 1ms)
    const local = this.get(key);
    if (local) return { ...local, isCacheHit: true };

    // Check Redis store (< 15ms)
    try {
      const cached = await cacheStore.get(key);
      if (cached) {
        const parsed = JSON.parse(cached);
        localMemoryMap.set(key, { data: parsed, expiresAt: Date.now() + 600000 }); // 10m local warm buffer
        return {
          ...parsed,
          isCacheHit: true,
        };
      }
    } catch (err) {
      console.warn('[AiCache] getAsync error:', err.message);
    }
    return null;
  }

  /**
   * Synchronous / Async setter compatible with legacy and Redis pipelines
   */
  static set(key, data, ttlSeconds = this.DEFAULT_TTL_SECONDS) {
    if (!key || !data) return;

    // 1. Immediately store in local fast memory map
    localMemoryMap.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });

    // 2. Persist asynchronously to Redis cluster / persistent store
    cacheStore.set(key, JSON.stringify(data), 'EX', ttlSeconds).catch((err) => {
      console.warn('[AiCache] Async Redis set failed:', err.message);
    });
  }

  /**
   * High-level diagnostic retrieval by symptom attributes
   */
  static async getCachedDiagnostic(params) {
    const key = this.generateKey(params);
    return this.getAsync(key);
  }

  /**
   * High-level diagnostic caching
   */
  static async setCachedDiagnostic(params, diagnosticData, ttl = this.DEFAULT_TTL_SECONDS) {
    const key = this.generateKey(params);
    this.set(key, diagnosticData, ttl);
    return key;
  }

  /**
   * Circuit breaker health checks for LLM providers
   */
  static isProviderHealthy(provider) {
    const info = providerHealth[provider];
    if (!info) return true;

    if (!info.isHealthy) {
      // Check if cooldown window has expired
      if (info.lastFailure && Date.now() - info.lastFailure > CIRCUIT_BREAKER_COOLDOWN_MS) {
        info.isHealthy = true;
        info.failures = 0;
        console.log(`[Circuit Breaker] Provider ${provider} health restored after cooldown`);
        return true;
      }
      return false;
    }
    return true;
  }

  static recordProviderSuccess(provider) {
    if (providerHealth[provider]) {
      providerHealth[provider].failures = 0;
      providerHealth[provider].isHealthy = true;
    }
  }

  static recordProviderFailure(provider, error) {
    if (!providerHealth[provider]) return;
    providerHealth[provider].failures += 1;
    providerHealth[provider].lastFailure = Date.now();

    if (providerHealth[provider].failures >= MAX_CONSECUTIVE_FAILURES) {
      providerHealth[provider].isHealthy = false;
      console.warn(
        `🚨 [Circuit Breaker] Tripped for provider "${provider}" after ${providerHealth[provider].failures} consecutive failures (${error?.message}). Cooldown: ${CIRCUIT_BREAKER_COOLDOWN_MS / 1000}s`
      );
    }
  }

  /**
   * Distributed lock stampede protection helper
   */
  static async withSingleFlight(key, ttlSeconds, fetcherFn) {
    const cached = await this.getAsync(key);
    if (cached) return cached;

    const lockKey = `lock:${key}`;
    const acquiredLock = await cacheStore.set(lockKey, 'locked', 'EX', 10, 'NX');

    if (acquiredLock) {
      try {
        const freshData = await fetcherFn();
        if (freshData) {
          this.set(key, freshData, ttlSeconds);
        }
        return freshData;
      } finally {
        await cacheStore.del(lockKey);
      }
    } else {
      // Concurrently poll for the single worker to populate cache
      for (let i = 0; i < 15; i++) {
        await new Promise((resolve) => setTimeout(resolve, 30));
        const retryCached = await this.getAsync(key);
        if (retryCached) return retryCached;
      }
      return fetcherFn();
    }
  }

  /**
   * Cache Invalidation & Telemetry
   */
  static invalidate(key) {
    if (!key) return false;
    localMemoryMap.delete(key);
    cacheStore.del(key).catch(() => {});
    return true;
  }

  static invalidateByCategory(categorySlug) {
    let count = 0;
    const target = (categorySlug || '').toLowerCase();
    for (const [key] of localMemoryMap.entries()) {
      if (key.toLowerCase().includes(target)) {
        this.invalidate(key);
        count++;
      }
    }
    return count;
  }

  static invalidateByLocality(locality) {
    let count = 0;
    const target = (locality || '').toLowerCase();
    for (const [key] of localMemoryMap.entries()) {
      if (key.toLowerCase().includes(target)) {
        this.invalidate(key);
        count++;
      }
    }
    return count;
  }

  static invalidatePattern(pattern) {
    let count = 0;
    const regex = new RegExp(pattern, 'i');
    for (const [key] of localMemoryMap.entries()) {
      if (regex.test(key)) {
        this.invalidate(key);
        count++;
      }
    }
    return count;
  }

  static clear() {
    localMemoryMap.clear();
  }

  static getStats() {
    const totalLocalKeys = localMemoryMap.size;
    return {
      totalKeys: totalLocalKeys,
      redisActive: cacheStore.isRedisActive(),
      providers: {
        openai: providerHealth.openai,
        gemini: providerHealth.gemini,
      },
      ttlSeconds: this.DEFAULT_TTL_SECONDS,
    };
  }
}

export default AiCacheService;
