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
      invalidatedEntries: 0,
    };

    // Telemetry buffer with circular capacity
    this.telemetryBuffer = [];
    this.maxTelemetryEvents = 250;

    // Circuit Breakers for external AI providers (Gemini, OpenAI)
    this.circuitBreakers = {
      gemini: {
        state: 'CLOSED', // 'CLOSED' | 'OPEN' | 'HALF_OPEN'
        consecutiveFailures: 0,
        failureThreshold: 3,
        lastFailureAt: null,
        cooldownMs: 60 * 1000, // 60s cooldown
        isSimulatedOutage: false,
      },
      openai: {
        state: 'CLOSED',
        consecutiveFailures: 0,
        failureThreshold: 3,
        lastFailureAt: null,
        cooldownMs: 60 * 1000,
        isSimulatedOutage: false,
      },
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
    this.recordTelemetry('CACHE_HIT', { key, categorySlug: entry.categorySlug, locality: entry.locality });
    return entry.value;
  }

  /**
   * Set cached diagnostic result
   */
  set(key, value, options = {}) {
    const categorySlug = options.categorySlug || value?.category?.slug || '';
    const locality = options.locality || '';
    const ttl = options.ttlMs || this.ttlMs;

    this.cache.set(key, {
      value,
      categorySlug,
      locality,
      createdAt: Date.now(),
      expiresAt: Date.now() + ttl,
    });

    this.recordTelemetry('CACHE_STORE', { key, categorySlug, locality, ttlMs: ttl });
  }

  /**
   * Invalidate specific cache key
   */
  invalidate(key) {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.tokenStats.invalidatedEntries++;
      this.recordTelemetry('CACHE_INVALIDATE_KEY', { key });
    }
    return deleted;
  }

  /**
   * Invalidate all cache entries matching category slug
   */
  invalidateByCategory(categorySlug) {
    if (!categorySlug) return 0;
    let count = 0;
    const target = categorySlug.toLowerCase().trim();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.categorySlug && entry.categorySlug.toLowerCase().includes(target)) {
        this.cache.delete(key);
        count++;
      }
    }

    this.tokenStats.invalidatedEntries += count;
    this.recordTelemetry('CACHE_INVALIDATE_CATEGORY', { categorySlug, count });
    return count;
  }

  /**
   * Invalidate all cache entries matching locality
   */
  invalidateByLocality(locality) {
    if (!locality) return 0;
    let count = 0;
    const target = locality.toLowerCase().trim();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.locality && entry.locality.toLowerCase().includes(target)) {
        this.cache.delete(key);
        count++;
      }
    }

    this.tokenStats.invalidatedEntries += count;
    this.recordTelemetry('CACHE_INVALIDATE_LOCALITY', { locality, count });
    return count;
  }

  /**
   * Invalidate by regex or substring match on key
   */
  invalidatePattern(pattern) {
    let count = 0;
    const isRegex = pattern instanceof RegExp;

    for (const key of this.cache.keys()) {
      const matches = isRegex ? pattern.test(key) : key.includes(pattern);
      if (matches) {
        this.cache.delete(key);
        count++;
      }
    }

    this.tokenStats.invalidatedEntries += count;
    this.recordTelemetry('CACHE_INVALIDATE_PATTERN', { pattern: pattern.toString(), count });
    return count;
  }

  /**
   * Prune expired cache items
   */
  pruneExpired() {
    const now = Date.now();
    let count = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Automated PII & Secrets Redaction Engine
   * Recursively sanitizes phone numbers, emails, credit cards, BVN, NIN, and API keys.
   */
  redact(data) {
    if (data == null) return data;

    if (typeof data === 'string') {
      return this._redactString(data);
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.redact(item));
    }

    if (typeof data === 'object') {
      const sanitized = {};
      const sensitiveKeys = new Set([
        'password',
        'token',
        'secret',
        'authorization',
        'privatekey',
        'apikey',
        'bvn',
        'nin',
        'creditcard',
      ]);

      for (const [key, val] of Object.entries(data)) {
        if (sensitiveKeys.has(key.toLowerCase())) {
          sanitized[key] = '[REDACTED_SECRET]';
        } else {
          sanitized[key] = this.redact(val);
        }
      }
      return sanitized;
    }

    return data;
  }

  /**
   * Internal regex-based string sanitizer
   */
  _redactString(str) {
    if (!str || typeof str !== 'string') return str;

    let result = str;

    // 1. API Keys, Bearer tokens & Secrets
    result = result.replace(/(?:AIza[0-9A-Za-z-_]{35}|sk-[0-9A-Za-z-_]{20,})/g, '[REDACTED_API_KEY]');
    result = result.replace(/Bearer\s+[A-Za-z0-9._~+/-]+=*/gi, 'Bearer [REDACTED_TOKEN]');

    // 2. Email addresses
    result = result.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]');

    // 3. Nigerian Phone Numbers (+234, 080, 070, 090, 081, 234)
    result = result.replace(/(?:\+?234|0)[789][01]\d{8}\b/g, '[REDACTED_PHONE]');

    // 4. Credit Card Numbers (13-19 digits with optional hyphens/spaces)
    result = result.replace(/\b(?:\d{4}[ -]?){3}\d{4}\b/g, '[REDACTED_CARD]');

    // 5. Nigerian BVN / NIN (standalone 11 consecutive digits)
    result = result.replace(/\b\d{11}\b/g, '[REDACTED_ID_NUMBER]');

    return result;
  }

  /**
   * Record telemetry event with automated redaction
   */
  recordTelemetry(eventType, payload = {}) {
    const sanitizedPayload = this.redact(payload);
    const eventRecord = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
      timestamp: new Date().toISOString(),
      eventType,
      payload: sanitizedPayload,
    };

    this.telemetryBuffer.push(eventRecord);
    if (this.telemetryBuffer.length > this.maxTelemetryEvents) {
      this.telemetryBuffer.shift();
    }

    return eventRecord;
  }

  /**
   * Retrieve redacted telemetry events
   */
  getTelemetry(limit = 50, filterType = null) {
    let events = [...this.telemetryBuffer];
    if (filterType) {
      events = events.filter((e) => e.eventType === filterType);
    }
    return events.slice(-limit);
  }

  /**
   * Circuit Breaker: Check if provider is healthy
   */
  isProviderHealthy(provider = 'gemini') {
    const cb = this.circuitBreakers[provider.toLowerCase()];
    if (!cb) return true;

    if (cb.isSimulatedOutage) {
      return false;
    }

    if (cb.state === 'OPEN') {
      const now = Date.now();
      if (cb.lastFailureAt && now - cb.lastFailureAt > cb.cooldownMs) {
        cb.state = 'HALF_OPEN';
        this.recordTelemetry('PROVIDER_CIRCUIT_HALF_OPEN', { provider });
        return true;
      }
      return false;
    }

    return true;
  }

  /**
   * Circuit Breaker: Record provider failure
   */
  recordProviderFailure(provider = 'gemini', error = null) {
    const key = provider.toLowerCase();
    const cb = this.circuitBreakers[key];
    if (!cb) return;

    cb.consecutiveFailures++;
    cb.lastFailureAt = Date.now();

    const errorMessage = error?.message || String(error || 'Unknown failure');

    if (cb.consecutiveFailures >= cb.failureThreshold || cb.state === 'HALF_OPEN') {
      cb.state = 'OPEN';
      this.recordTelemetry('PROVIDER_CIRCUIT_TRIPPED', {
        provider: key,
        consecutiveFailures: cb.consecutiveFailures,
        error: errorMessage,
      });
    } else {
      this.recordTelemetry('PROVIDER_FAILURE_RECORDED', {
        provider: key,
        consecutiveFailures: cb.consecutiveFailures,
        error: errorMessage,
      });
    }
  }

  /**
   * Circuit Breaker: Record provider success
   */
  recordProviderSuccess(provider = 'gemini') {
    const key = provider.toLowerCase();
    const cb = this.circuitBreakers[key];
    if (!cb) return;

    if (cb.state === 'HALF_OPEN' || cb.consecutiveFailures > 0) {
      this.recordTelemetry('PROVIDER_CIRCUIT_RESTORED', {
        provider: key,
        previousState: cb.state,
      });
    }

    cb.state = 'CLOSED';
    cb.consecutiveFailures = 0;
    cb.lastFailureAt = null;
  }

  /**
   * Outage Simulation: Explicitly simulate or clear an outage
   */
  simulateOutage(provider = 'gemini', enabled = true) {
    const key = provider.toLowerCase();
    const cb = this.circuitBreakers[key];
    if (!cb) return;

    cb.isSimulatedOutage = Boolean(enabled);
    if (enabled) {
      cb.state = 'OPEN';
      cb.lastFailureAt = Date.now();
      this.recordTelemetry('SIMULATED_OUTAGE_TRIGGERED', { provider: key });
    } else {
      cb.state = 'CLOSED';
      cb.consecutiveFailures = 0;
      cb.lastFailureAt = null;
      this.recordTelemetry('SIMULATED_OUTAGE_RESOLVED', { provider: key });
    }
  }

  /**
   * Get Circuit Breakers Status
   */
  getCircuitStatus() {
    const status = {};
    for (const [provider, cb] of Object.entries(this.circuitBreakers)) {
      status[provider] = {
        state: cb.state,
        consecutiveFailures: cb.consecutiveFailures,
        isSimulatedOutage: cb.isSimulatedOutage,
        isHealthy: this.isProviderHealthy(provider),
      };
    }
    return status;
  }

  /**
   * Deterministic Safe Fallback Diagnostic Response during Outages
   */
  getOutageFallbackResponse(categorySlug = 'plumbing-and-pipefitting', locality = 'Lagos') {
    return {
      session: {
        id: `outage-fallback-${Date.now()}`,
        diagnosticTitle: 'Technical Fault Inspection (Offline Resilience Mode)',
        probableCause: 'AI providers are temporarily under maintenance or degraded. Deterministic safety protocol activated.',
        severity: 'MODERATE',
        urgency: 'SCHEDULED',
        isHazardous: false,
        safetyInstructions: [
          'Isolate electrical circuit breaker or main water stopcock if leakage or abnormal sounds persist.',
          'Do not expose wet surfaces to active live current.',
        ],
        diyAllowed: false,
        clarificationQuestion: 'What is the primary visible manifestation of this issue?',
        clarificationOptions: ['Abnormal noise or vibration', 'Fluid or gas leakage', 'Total loss of power / function'],
        currency: 'NGN',
        estimatedLaborMin: 5000,
        estimatedLaborMax: 12000,
        estimatedBOM: [
          {
            item: 'Standard Diagnostic & Inspection Materials',
            specification: 'Preliminary Service Pack',
            quantity: 1,
            unit: 'SET',
            estimatedCostMin: 2500,
            estimatedCostMax: 5000,
            sourceType: 'REGIONAL_INDEX',
            isPriceIndexed: true,
            pricingDisclaimer: 'Indicative base rate during temporary maintenance mode.',
          },
        ],
      },
      conversationalReply:
        "Hello! I'm Oga John. Our primary neural diagnostic engine is experiencing brief scheduled network maintenance, but my core engineering protocols remain fully active. Please isolate any leaking valves or breakers, and I can immediately match you with a verified specialist in your area.",
      isResilienceFallback: true,
    };
  }

  /**
   * Retrieve cache telemetry stats & provider health
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
      circuitBreakers: this.getCircuitStatus(),
      recentTelemetryCount: this.telemetryBuffer.length,
    };
  }

  clear() {
    this.cache.clear();
    this.telemetryBuffer = [];
  }
}

export const AiCacheService = new DiagnosticCacheEngine();
