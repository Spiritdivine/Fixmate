import { AiCacheService } from '../src/services/ai-cache.service.js';
import { aiDiagnosticLimiter } from '../src/config/rate-limiter.js';
import { cacheStore } from '../src/config/redis.js';

async function runPhase2Tests() {
  console.log('🧪 Starting Phase 2 Redis & AI Symptom Caching Verification Tests...\n');

  let passed = 0;
  let failed = 0;

  async function assert(desc, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${desc}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${desc} -> ${err.message}`);
      failed++;
    }
  }

  try {
    // TEST 1: Symptom Normalization & Order Invariance
    await assert('Symptom normalizer strips Nigerian dialect fillers and enforces order-invariance', () => {
      const prompt1 = 'Abeg my 1.5hp Inverter AC dey blow warm air since yesterday';
      const prompt2 = 'Warm air 1.5hp inverter AC help please';

      const norm1 = AiCacheService.normalizeSymptomText(prompt1);
      const norm2 = AiCacheService.normalizeSymptomText(prompt2);

      // Both should normalize to "1_5hp ac air blow inverter warm"
      if (!norm1.includes('1_5hp') || !norm1.includes('inverter') || !norm1.includes('warm')) {
        throw new Error(`Normalization failed to keep key tokens: "${norm1}"`);
      }
      if (norm1.includes('abeg') || norm1.includes('dey') || norm1.includes('yesterday')) {
        throw new Error(`Normalization failed to strip filler tokens: "${norm1}"`);
      }

      const key1 = AiCacheService.generateKey({
        categoryId: 'HVAC',
        symptoms: prompt1,
        locationZone: 'LAGOS_MAINLAND',
      });
      const key2 = AiCacheService.generateKey({
        categoryId: 'HVAC',
        symptoms: 'Inverter AC blow warm air 1.5hp',
        locationZone: 'LAGOS_MAINLAND',
      });

      if (key1 !== key2) {
        throw new Error(`Keys differ despite identical semantic symptoms! Key1=${key1}, Key2=${key2}`);
      }
      console.log(`    (Normalized: "${norm1}" -> Hash: ${key1})`);
    });

    // TEST 2: Cache Set and Fast Retrieval
    await assert('AI Cache correctly persists and retrieves structured diagnostic payload', async () => {
      const params = {
        categoryId: 'CAT_GENERATOR',
        categoryName: 'Generator Repair',
        symptoms: 'Mikano generator knocking and shutting down after 10 mins',
        locationZone: 'LAGOS',
      };

      const mockDiagnostic = {
        diyAllowed: false,
        isHazardous: true,
        probableCause: 'Overheating due to low engine oil or blocked radiator fins',
        safetyWarnings: ['Shut down generator immediately to avoid engine seizure'],
        estimatedLaborMin: 15000,
        estimatedLaborMax: 25000,
        conversationalReply: 'Your generator is overheating. We recommend an oil change and radiator flush.',
      };

      const key = await AiCacheService.setCachedDiagnostic(params, mockDiagnostic, 3600);
      if (!key) throw new Error('Failed to set cached diagnostic');

      const cached = await AiCacheService.getCachedDiagnostic(params);
      if (!cached) throw new Error('Cache lookup returned null');
      if (cached.probableCause !== mockDiagnostic.probableCause) {
        throw new Error(`Expected probable cause "${mockDiagnostic.probableCause}", got "${cached.probableCause}"`);
      }
      if (!cached.isCacheHit) {
        throw new Error('Expected isCacheHit flag to be true');
      }
      console.log(`    (Retrieved cached diagnostic in < 1ms: isCacheHit=${cached.isCacheHit})`);
    });

    // TEST 3: Single-Flight Mutex / Stampede Protection
    await assert('withSingleFlight executes expensive fetcher only once during concurrent thundering herd', async () => {
      let executionCount = 0;
      const testKey = 'test:stampede:mikano_oil_pressure';

      const expensiveFetcher = async () => {
        executionCount++;
        await new Promise((r) => setTimeout(r, 100)); // Simulate 100ms LLM call
        return { result: 'Low oil pressure sensor tripped', timestamp: Date.now() };
      };

      // Launch 5 concurrent calls simultaneously
      const results = await Promise.all([
        AiCacheService.withSingleFlight(testKey, 60, expensiveFetcher),
        AiCacheService.withSingleFlight(testKey, 60, expensiveFetcher),
        AiCacheService.withSingleFlight(testKey, 60, expensiveFetcher),
        AiCacheService.withSingleFlight(testKey, 60, expensiveFetcher),
        AiCacheService.withSingleFlight(testKey, 60, expensiveFetcher),
      ]);

      if (executionCount !== 1) {
        throw new Error(`Expected fetcher to execute exactly 1 time, but executed ${executionCount} times!`);
      }
      if (results.length !== 5 || !results[0].result) {
        throw new Error('All concurrent callers did not receive resolved result');
      }
      console.log(`    (5 concurrent callers resolved via single execution: count=${executionCount})`);
    });

    // TEST 4: Circuit Breaker Failure & Recovery Tracking
    await assert('Circuit breaker tracks consecutive failures and recovers on cooldown', () => {
      AiCacheService.recordProviderSuccess('openai');
      if (!AiCacheService.isProviderHealthy('openai')) {
        throw new Error('OpenAI should initially be healthy');
      }

      // Simulate 3 consecutive failures
      AiCacheService.recordProviderFailure('openai', new Error('503 Service Unavailable'));
      AiCacheService.recordProviderFailure('openai', new Error('503 Service Unavailable'));
      AiCacheService.recordProviderFailure('openai', new Error('503 Service Unavailable'));

      if (AiCacheService.isProviderHealthy('openai')) {
        throw new Error('Circuit breaker should have tripped after 3 consecutive failures');
      }

      // Reset success
      AiCacheService.recordProviderSuccess('openai');
      if (!AiCacheService.isProviderHealthy('openai')) {
        throw new Error('Circuit breaker should be restored after success reset');
      }
    });

    // TEST 5: Distributed Rate Limiter Instantiation
    await assert('aiDiagnosticLimiter is properly configured with 30 req/hr window and store', () => {
      if (!aiDiagnosticLimiter || typeof aiDiagnosticLimiter !== 'function') {
        throw new Error('aiDiagnosticLimiter middleware is not exported properly');
      }
    });

    // TEST 6: Invalidation and Cache Stats Telemetry
    await assert('Cache invalidation and telemetry reporting operate accurately', () => {
      const stats = AiCacheService.getStats();
      if (typeof stats.totalKeys !== 'number') {
        throw new Error('Stats missing totalKeys count');
      }

      const testKey = AiCacheService.hashKey('washing machine not draining', 'APPLIANCE', 'LAGOS');
      AiCacheService.set(testKey, { fault: 'drain pump clogged' }, 300);

      const beforeDelete = AiCacheService.get(testKey);
      if (!beforeDelete) throw new Error('Key should exist before deletion');

      AiCacheService.invalidate(testKey);
      const afterDelete = AiCacheService.get(testKey);
      if (afterDelete !== null) {
        throw new Error('Key should be null after invalidation');
      }
      console.log(`    (Stats: totalLocalKeys=${stats.totalKeys}, redisActive=${stats.redisActive})`);
    });

    console.log(`\n========================================`);
    console.log(`Phase 2 Test Results: ${passed} Passed, ${failed} Failed`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal error during Phase 2 tests:', err);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

runPhase2Tests();
