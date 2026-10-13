/**
 * PHASE 6 VERIFICATION TEST:
 * Outage Resilience, Circuit Breakers, Cache Invalidation & Telemetry Redaction
 */

import { AiCacheService } from '../src/services/ai-cache.service.js';
import { AiDiagnosticService } from '../src/services/ai-diagnostic.service.js';
import assert from 'assert';

async function runOutageAndResilienceSuite() {
  console.log('====================================================');
  console.log('🛡️ TESTING AI RESILIENCE, REDACTION & OUTAGE SUITE');
  console.log('====================================================\n');

  // -------------------------------------------------------------------
  // TEST 1: Automated Telemetry PII & Secret Redaction
  // -------------------------------------------------------------------
  console.log('TEST 1: Automated Telemetry Redaction Engine...');

  const sensitivePayload = {
    userMessage: 'Call me on 08023456789 or +2348098765432 regarding my leaking pipe.',
    clientEmail: 'customer.test@fixmate.ng',
    securityContext: {
      geminiKey: 'AIzaSyD_Test_Gemini_Key_9876543210123456',
      openaiKey: 'sk-abcdef1234567890abcdef1234567890',
      bearerToken: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.secret',
      bvn: '22334455667',
      creditCard: '4111-2222-3333-4444',
      password: 'superSecretPassword123!',
    },
  };

  const eventRecord = AiCacheService.recordTelemetry('USER_INQUIRY_LOG', sensitivePayload);

  // Assertions on the recorded event
  const sanitized = eventRecord.payload;
  console.log('   Sanitized User Message:', sanitized.userMessage);
  console.log('   Sanitized Email:', sanitized.clientEmail);
  console.log('   Sanitized Gemini Key:', sanitized.securityContext.geminiKey);
  console.log('   Sanitized Password Field:', sanitized.securityContext.password);
  console.log('   Sanitized Card:', sanitized.securityContext.creditCard);

  assert.ok(!sanitized.userMessage.includes('08023456789'), 'Phone 1 leaked');
  assert.ok(!sanitized.userMessage.includes('+2348098765432'), 'Phone 2 leaked');
  assert.ok(sanitized.userMessage.includes('[REDACTED_PHONE]'), 'Phone redaction token missing');

  assert.strictEqual(sanitized.clientEmail, '[REDACTED_EMAIL]', 'Email not redacted');
  assert.ok(!sanitized.securityContext.geminiKey.includes('AIzaSyD'), 'Gemini key leaked');
  assert.ok(!sanitized.securityContext.openaiKey.includes('sk-abcdef'), 'OpenAI key leaked');
  assert.strictEqual(sanitized.securityContext.password, '[REDACTED_SECRET]', 'Password field not redacted');
  assert.ok(!sanitized.securityContext.creditCard.includes('4111'), 'Credit card leaked');

  console.log('✅ PASSED: All PII, tokens, and credentials successfully redacted in telemetry!\n');

  // -------------------------------------------------------------------
  // TEST 2: Multi-Dimensional Cache Invalidation
  // -------------------------------------------------------------------
  console.log('TEST 2: Cache Invalidation (Key, Category, Locality)...');

  AiCacheService.clear();

  // Populate test cache entries
  AiCacheService.set('plumb_lekki_1', { title: 'Pipe Leak 1' }, { categorySlug: 'plumbing-and-pipefitting', locality: 'Lekki' });
  AiCacheService.set('plumb_ikeja_1', { title: 'Pipe Leak 2' }, { categorySlug: 'plumbing-and-pipefitting', locality: 'Ikeja' });
  AiCacheService.set('elec_lekki_1', { title: 'Breaker Trip' }, { categorySlug: 'electrical-wiring', locality: 'Lekki' });
  AiCacheService.set('ac_yaba_1', { title: 'AC Not Cooling' }, { categorySlug: 'hvac-and-refrigeration', locality: 'Yaba' });

  assert.strictEqual(AiCacheService.cache.size, 4, 'Initial cache population count incorrect');

  // Invalidate by category
  const invalidatedCat = AiCacheService.invalidateByCategory('plumbing-and-pipefitting');
  assert.strictEqual(invalidatedCat, 2, 'Category invalidation count mismatch');
  assert.strictEqual(AiCacheService.cache.has('plumb_lekki_1'), false, 'Category item 1 still in cache');
  assert.strictEqual(AiCacheService.cache.has('plumb_ikeja_1'), false, 'Category item 2 still in cache');
  assert.strictEqual(AiCacheService.cache.has('elec_lekki_1'), true, 'Unrelated item erroneously deleted');

  // Invalidate by locality
  const invalidatedLoc = AiCacheService.invalidateByLocality('Lekki');
  assert.strictEqual(invalidatedLoc, 1, 'Locality invalidation count mismatch');
  assert.strictEqual(AiCacheService.cache.has('elec_lekki_1'), false, 'Locality item still in cache');
  assert.strictEqual(AiCacheService.cache.has('ac_yaba_1'), true, 'Yaba item erroneously deleted');

  // Invalidate by specific key
  const invalidatedKey = AiCacheService.invalidate('ac_yaba_1');
  assert.strictEqual(invalidatedKey, true, 'Specific key invalidation failed');
  assert.strictEqual(AiCacheService.cache.size, 0, 'Cache should be empty');

  console.log('✅ PASSED: Category, locality, and key cache invalidations validated!\n');

  // -------------------------------------------------------------------
  // TEST 3: Outage Injection Simulation & Zero-Downtime Resilience
  // -------------------------------------------------------------------
  console.log('TEST 3: Outage Injection Simulation (Chaos Testing)...');

  // 1. Simulate total provider outage for both Gemini and OpenAI
  AiCacheService.simulateOutage('gemini', true);
  AiCacheService.simulateOutage('openai', true);

  const circuitStatus = AiCacheService.getCircuitStatus();
  console.log('   Circuit Breaker Status during Simulated Outage:', circuitStatus);
  assert.strictEqual(circuitStatus.gemini.isHealthy, false, 'Gemini circuit should be unhealthy');
  assert.strictEqual(circuitStatus.openai.isHealthy, false, 'OpenAI circuit should be unhealthy');

  // 2. Execute diagnosis while both primary providers are offline
  const diagnosticResult = await AiDiagnosticService.runDiagnostic({
    textPrompt: 'My water heater in the bathroom is whistling loudly and leaking from the bottom fitting',
    clientAddress: 'Lekki Phase 1, Lagos',
  });

  console.log('   Resilience Diagnosis Title:', diagnosticResult.session.diagnosticTitle);
  console.log('   Resilience Category:', diagnosticResult.category?.name);
  console.log('   Resilience BOM Count:', diagnosticResult.session.estimatedBOM?.length);

  assert.ok(diagnosticResult.session.diagnosticTitle, 'Diagnostic title missing during outage');
  assert.ok(diagnosticResult.session.probableCause, 'Probable cause missing during outage');
  assert.ok(diagnosticResult.session.estimatedBOM.length > 0, 'BOM missing during outage');
  assert.ok(diagnosticResult.session.safetyInstructions.length > 0, 'Safety instructions missing during outage');

  // 3. Restore circuit breakers
  AiCacheService.simulateOutage('gemini', false);
  AiCacheService.simulateOutage('openai', false);

  const restoredStatus = AiCacheService.getCircuitStatus();
  assert.strictEqual(restoredStatus.gemini.isHealthy, true, 'Gemini circuit should be healthy after restore');
  assert.strictEqual(restoredStatus.openai.isHealthy, true, 'OpenAI circuit should be healthy after restore');

  console.log('✅ PASSED: Zero-downtime resilience successfully engaged during total AI outage!\n');

  console.log('🎉 ALL PHASE 6 OBSERVABILITY & RESILIENCE TESTS PASSED!');
  process.exit(0);
}

runOutageAndResilienceSuite().catch((err) => {
  console.error('❌ Phase 6 Test Failed:', err);
  process.exit(1);
});
