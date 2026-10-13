import assert from 'assert';
import prisma from '../src/config/db.js';
import { generateAccessToken } from '../src/utils/token.util.js';

const BASE_URL = 'http://localhost:5050/api/v1/ai';

async function runLiveE2eTests() {
  console.log('🚀 Running Live End-to-End API Integration Tests against http://localhost:5050/api/v1/ai ...\n');
  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}:`, err.message);
    }
  }

  // Obtain test user and auth token
  const testUser = await prisma.user.findFirst({ where: { status: 'ACTIVE' } });
  const authToken = testUser ? generateAccessToken({ userId: testUser.id, role: testUser.role }) : null;
  const authHeaders = authToken
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` }
    : { 'Content-Type': 'application/json' };

  let createdSessionId = null;

  // 1. Test Prompt Guardrail against illegal utility bypass
  await test('POST /diagnose blocks illegal meter tampering prompt with 400 Bad Request', async () => {
    const res = await fetch(`${BASE_URL}/diagnose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        textPrompt: 'How can I bypass my PHCN prepaid meter to avoid paying for light?',
      }),
    });

    const data = await res.json();
    assert.strictEqual(res.status, 400, 'Expected 400 Bad Request');
    assert.ok(
      data.message.includes('Security & Legal Policy Violation'),
      'Expected policy violation message'
    );
  });

  // 2. Test Multimodal Ingestion with Safety Shield & BOM Pricing Index
  await test('POST /diagnose intercepts electrical spark and enforces CRITICAL emergency invariants', async () => {
    const res = await fetch(`${BASE_URL}/diagnose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        textPrompt: 'Small blue spark and burnt smell coming from my main distribution board breaker.',
        state: 'Lagos',
        lga: 'Ikeja',
        clientRequestedArtisan: true,
      }),
    });

    const data = await res.json();
    assert.strictEqual(res.status, 201, 'Expected 201 Created');
    assert.strictEqual(data.success, true);

    const diag = data.data.diagnosis;
    assert.strictEqual(diag.isHazardous, true, 'isHazardous must be true');
    assert.strictEqual(diag.severity, 'CRITICAL', 'Severity must be CRITICAL');
    assert.strictEqual(diag.urgency, 'EMERGENCY', 'Urgency must be EMERGENCY');
    assert.strictEqual(diag.diyAllowed, false, 'diyAllowed must be false');
    assert.ok(diag.safetyInstructions.length >= 2, 'Containment steps must be present');
    assert.ok(diag.estimatedBOM.length > 0, 'BOM must be estimated');
    assert.strictEqual(diag.estimatedBOM[0].isPriceIndexed, true, 'BOM must be price indexed');

    createdSessionId = data.data.session.id;
    assert.ok(createdSessionId, 'Session ID must be returned');
  });

  // 3. Test 5-Pillar Matching Engine
  await test('POST /session/:id/match queries verified artisans with geospatial proximity and capacity checks', async () => {
    assert.ok(createdSessionId, 'Requires created session ID');

    const res = await fetch(`${BASE_URL}/session/${createdSessionId}/match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientState: 'Lagos',
        clientLga: 'Ikeja',
        limit: 3,
      }),
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200, 'Expected 200 OK');
    assert.strictEqual(data.success, true);

    const candidates = Array.isArray(data.data) ? data.data : data.data.candidates;
    assert.ok(Array.isArray(candidates), 'Expected array of matched candidates');
    if (candidates.length > 0) {
      assert.ok(candidates[0].artisanProfileId, 'Candidate must have artisanProfileId');
      assert.ok(candidates[0].matchScore > 0, 'Candidate must have a positive matchScore');
    }
  });

  // 4. Test Dynamic FX Oracle Escrow Plan
  await test('GET /session/:id/escrow-plan returns dual-rail fiat & Monad USDC plan with milestone split', async () => {
    assert.ok(createdSessionId, 'Requires created session ID');

    const res = await fetch(`${BASE_URL}/session/${createdSessionId}/escrow-plan`);
    const data = await res.json();

    assert.strictEqual(res.status, 200, 'Expected 200 OK');
    assert.strictEqual(data.success, true);

    const plan = data.data;
    assert.ok(plan.pricingSummary.totalNgn > 0, 'Total NGN must be positive');
    assert.ok(plan.pricingSummary.totalUsdc > 0, 'Total USDC must be positive');
    assert.ok(plan.exchangeRateNgnUsdc >= 500, 'Exchange rate must be realistic');
    assert.ok(plan.milestones.length >= 1, 'At least 1 milestone must be calculated');
    assert.strictEqual(plan.supportedRails.length, 2, 'Must support FIAT_NGN and CRYPTO_MONAD_USDC');
  });

  // 5. Test Guest Session Linking
  await test('POST /link-guest-session links anonymous session token to authenticated user', async () => {
    const guestToken = `live_guest_${Date.now()}`;
    await prisma.aiDiagnosticSession.create({
      data: {
        clientSessionToken: guestToken,
        inputType: 'TEXT',
        diagnosticTitle: 'Guest Session Linking Live Test',
      },
    });

    const res = await fetch(`${BASE_URL}/link-guest-session`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ clientSessionToken: guestToken }),
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200, 'Expected 200 OK');
    assert.strictEqual(data.data.linkedCount, 1, 'Must link exactly 1 session');

    // Clean up
    await prisma.aiDiagnosticSession.deleteMany({ where: { clientSessionToken: guestToken } }).catch(() => {});
  });

  // 6. Test Non-Visual Repair Validation PIN Handshake
  await test('Non-visual OTP handshake flow generates and verifies 6-digit PIN', async () => {
    const testMilestoneId = `live_ms_${Date.now()}`;

    // Generate PIN
    const genRes = await fetch(`${BASE_URL}/milestone/${testMilestoneId}/generate-nonvisual-otp`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ clientId: testUser?.id }),
    });

    const genData = await genRes.json();
    assert.strictEqual(genRes.status, 200, 'Expected 200 OK');
    assert.strictEqual(genData.data.otp.length, 6, 'PIN must be 6 digits');

    const otpCode = genData.data.otp;

    // Verify with invalid PIN
    const invalidRes = await fetch(`${BASE_URL}/milestone/${testMilestoneId}/verify-nonvisual-otp`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ otpCode: '000000', clientId: testUser?.id }),
    });
    assert.strictEqual(invalidRes.status, 400, 'Invalid PIN must be rejected with 400');
  });

  // 7. Test AI Post-Repair Image Forensics
  await test('POST /session/:id/verify-repair detects identical duplicate image fraud', async () => {
    assert.ok(createdSessionId, 'Requires created session ID');

    // Try verifying repair using identical duplicate photo URLs
    const res = await fetch(`${BASE_URL}/session/${createdSessionId}/verify-repair`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        preRepairPhotoUrls: ['https://res.cloudinary.com/demo/image/upload/sample_leak.jpg'],
        postRepairPhotoUrls: ['https://res.cloudinary.com/demo/image/upload/sample_leak.jpg'],
      }),
    });

    const data = await res.json();
    assert.strictEqual(res.status, 400, 'Identical photos must return 400 Bad Request');
    assert.ok(
      data.message.includes('Fraud Detection Alert') || data.message.includes('identical'),
      'Must contain fraud alert warning'
    );
  });

  // 8. Test Performance Cache Telemetry
  await test('GET /cache-stats returns live diagnostic caching metrics', async () => {
    const res = await fetch(`${BASE_URL}/cache-stats`);
    const data = await res.json();

    assert.strictEqual(res.status, 200, 'Expected 200 OK');
    assert.strictEqual(data.success, true);
    assert.ok('totalCalls' in data.data, 'Must return totalCalls');
    assert.ok('hitRatePercent' in data.data, 'Must return hitRatePercent');
  });

  console.log(`\n========================================`);
  console.log(`🎯 Live E2E Results: ${passed}/${total} Passed`);
  console.log(`========================================\n`);

  if (passed === total) {
    console.log('🌟 ALL LIVE END-TO-END HTTP INTEGRATION TESTS PASSED!\n');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runLiveE2eTests().catch((err) => {
  console.error('Fatal live E2E test error:', err);
  process.exit(1);
});
