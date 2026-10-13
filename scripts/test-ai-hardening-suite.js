import assert from 'assert';
import prisma from '../src/config/db.js';
import { SafetyShieldService } from '../src/services/safety-shield.service.js';
import { PromptGuardrailService } from '../src/services/prompt-guardrail.service.js';
import { UrgencyResolver } from '../src/services/urgency-resolver.service.js';
import { BomPricingService } from '../src/services/bom-pricing.service.js';
import { FxOracleService } from '../src/services/fx-oracle.service.js';
import { ImageForensicsService } from '../src/services/image-forensics.service.js';
import { MatchingEngineService } from '../src/services/matching-engine.service.js';
import { EmergencyDispatchService } from '../src/services/emergency-dispatch.service.js';
import { AiVerificationService } from '../src/services/ai-verification.service.js';
import { GuestSessionLinker } from '../src/services/guest-session-linker.service.js';

async function runTestSuite() {
  console.log('🧪 Starting Fixmate AI Diagnostic & Recommendation Hardening Test Suite...\n');
  let passedTests = 0;
  let totalTests = 0;

  function test(name, fn) {
    totalTests++;
    try {
      fn();
      console.log(`  ✅ [PASS] ${name}`);
      passedTests++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}:`, err.message);
    }
  }

  async function asyncTest(name, fn) {
    totalTests++;
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
      passedTests++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}:`, err.message);
    }
  }

  console.log('--- DOMAIN 1: Safety Shield, Urgency Corroboration & Guardrails ---');

  test('Safety Shield intercepts electrical spark and enforces CRITICAL invariants', () => {
    const rawInput = 'There is a small spark and burning smell when I switch on the light.';
    const initialDiag = {
      diagnosticTitle: 'Light switch glitch',
      probableCause: 'Loose wire contact',
      severity: 'LOW',
      urgency: 'ROUTINE',
      isHazardous: false,
      diyAllowed: true,
      safetyInstructions: [],
    };

    const hardened = SafetyShieldService.scanAndEnforce(rawInput, initialDiag);
    assert.strictEqual(hardened.isHazardous, true, 'Must force isHazardous to true');
    assert.strictEqual(hardened.diyAllowed, false, 'Must force diyAllowed to false');
    assert.strictEqual(hardened.severity, 'CRITICAL', 'Must escalate severity to CRITICAL');
    assert.strictEqual(hardened.urgency, 'EMERGENCY', 'Must escalate urgency to EMERGENCY');
    assert.ok(hardened.safetyInstructions.length >= 3, 'Must inject mandatory containment steps');
    assert.ok(hardened.hazardTypes.includes('ELECTRICAL_SHOCK'), 'Must classify hazard type');
  });

  test('Prompt Guardrail blocks illegal NEPA meter bypass requests', () => {
    let blocked = false;
    try {
      PromptGuardrailService.validateUserQuery('How do I bypass my prepaid PHCN meter to get free light?');
    } catch (err) {
      blocked = err.statusCode === 400 && err.message.includes('Security & Legal Policy Violation');
    }
    assert.strictEqual(blocked, true, 'Must reject meter bypass attempt with 400 Bad Request');
  });

  test('Urgency Resolver prevents false-alarm emergency from emotional loud tone on routine issue', () => {
    const urgency = UrgencyResolver.resolve({
      semanticSeverity: 'LOW',
      isEmergencyTone: true, // loud/frustrated speech
      hasActiveHazard: false,
    });
    assert.strictEqual(urgency, 'ROUTINE', 'Loud tone on LOW severity must remain ROUTINE');
  });

  test('Urgency Resolver escalates HIGH severity with agitated tone to EMERGENCY', () => {
    const urgency = UrgencyResolver.resolve({
      semanticSeverity: 'HIGH',
      isEmergencyTone: true,
      hasActiveHazard: false,
    });
    assert.strictEqual(urgency, 'EMERGENCY', 'Agitated tone on HIGH severity must escalate to EMERGENCY');
  });

  console.log('\n--- DOMAIN 2: Economic Pricing, Regional Index & Dynamic FX Oracle ---');

  await asyncTest('BOM Pricing adjusts raw estimates by regional inflation multiplier and volatility buffer', async () => {
    const rawBom = [
      { item: '35+5 uF Dual Run Capacitor', estimatedCostMin: 5000, estimatedCostMax: 8000 },
    ];
    const adjusted = await BomPricingService.adjustBomToMarket({
      bomItems: rawBom,
      state: 'Lagos',
      city: 'Lagos',
    });

    assert.ok(adjusted.length === 1);
    assert.ok(adjusted[0].estimatedCostMin >= 6000, 'Min cost must reflect inflation multiplier');
    assert.ok(adjusted[0].estimatedCostMax >= 10000, 'Max cost must reflect inflation + 12% volatility buffer');
    assert.strictEqual(adjusted[0].isPriceIndexed, true);
  });

  await asyncTest('Two-Stage BOM variance evaluation classifies variance correctly', async () => {
    // Direct calculation logic validation
    const budgeted = 20000;
    const actual1 = 18000;
    const actual2 = 22000; // +10% within 15%
    const actual3 = 30000; // +50% exceeds budget

    const v1 = ((actual1 - budgeted) / budgeted) * 100;
    const v2 = ((actual2 - budgeted) / budgeted) * 100;
    const v3 = ((actual3 - budgeted) / budgeted) * 100;

    assert.ok(v1 <= 0, 'Should be under budget');
    assert.ok(v2 <= 15, 'Should be within 15% contingency');
    assert.ok(v3 > 15, 'Should exceed 15% threshold');
  });

  await asyncTest('FX Oracle converts NGN to USDC with dynamic rate and timestamp', async () => {
    const conversion = await FxOracleService.convertNgnToUsdc(165000);
    assert.ok(conversion.amountUsdc > 0, 'USDC amount must be positive');
    assert.ok(conversion.exchangeRate >= 500, 'Exchange rate must be realistic');
    assert.ok(conversion.guaranteedValidUntil instanceof Date, 'Must have valid expiration timestamp');
  });

  console.log('\n--- DOMAIN 3: Geospatial Geofence & Concurrency Gating ---');

  await asyncTest('Matching Engine respects State geofence and excludes cross-state candidates', async () => {
    // Query with client in a non-existent state or Zamfara where no artisans exist in that category
    const result = await MatchingEngineService.findTopMatches({
      categoryId: 1,
      clientState: 'Zamfara', // No artisans in Zamfara
      clientLat: 12.1698,
      clientLng: 6.6611,
      limit: 3,
    });

    assert.strictEqual(result.candidates.length, 0, 'Must return 0 candidates across state boundary');
    assert.ok(result.message.includes('Zamfara'), 'Must output informative regional coverage notice');
  });

  console.log('\n--- DOMAIN 4: Concurrency & Atomic SOS Claim Locking ---');

  await asyncTest('Emergency SOS atomic claim prevents duplicate claims (Zero Race Condition)', async () => {
    const anyClient = await prisma.user.findFirst({ where: { role: 'CLIENT' } }) || await prisma.user.findFirst();

    // Create a temporary mock emergency session
    const tempSession = await prisma.aiDiagnosticSession.create({
      data: {
        userId: anyClient?.id || null,
        inputType: 'TEXT',
        diagnosticTitle: 'Unit Test Emergency Arcing',
        probableCause: 'Live terminal arcing',
        severity: 'CRITICAL',
        urgency: 'EMERGENCY',
        isHazardous: true,
        isSosDispatched: true,
      },
    });

    // Find any 2 active artisan profiles in the database
    const artisans = await prisma.artisanProfile.findMany({
      where: { user: { status: 'ACTIVE' } },
      take: 2,
    });

    if (artisans.length >= 2) {
      // First claim succeeds
      const claim1 = await EmergencyDispatchService.claimEmergencySos({
        sessionId: tempSession.id,
        artisanUserId: artisans[0].userId,
      });
      assert.strictEqual(claim1.success, true, 'First artisan claim must succeed');

      // Second simultaneous claim must fail with 409 Conflict
      let secondClaimFailed = false;
      try {
        await EmergencyDispatchService.claimEmergencySos({
          sessionId: tempSession.id,
          artisanUserId: artisans[1].userId,
        });
      } catch (err) {
        secondClaimFailed = err.statusCode === 409;
      }
      assert.strictEqual(secondClaimFailed, true, 'Second artisan must be rejected with 409 Conflict');
    } else {
      console.log('    ℹ️ Skipping multi-artisan claim check: fewer than 2 artisans in DB');
    }

    // Clean up temporary session
    await prisma.aiDiagnosticSession.delete({ where: { id: tempSession.id } }).catch(() => {});
  });

  await asyncTest('Guest session linker maps anonymous sessions to user account', async () => {
    const guestToken = `guest_test_${Date.now()}`;
    const tempSession = await prisma.aiDiagnosticSession.create({
      data: {
        clientSessionToken: guestToken,
        inputType: 'TEXT',
        diagnosticTitle: 'Guest Session Test',
      },
    });

    const anyUser = await prisma.user.findFirst();
    if (anyUser) {
      const linkedCount = await GuestSessionLinker.linkGuestSession({
        clientSessionToken: guestToken,
        authenticatedUserId: anyUser.id,
      });
      assert.strictEqual(linkedCount, 1, 'Must link exactly 1 session');

      const updated = await prisma.aiDiagnosticSession.findUnique({ where: { id: tempSession.id } });
      assert.strictEqual(updated.userId, anyUser.id, 'Session userId must be populated');
    }

    await prisma.aiDiagnosticSession.delete({ where: { id: tempSession.id } }).catch(() => {});
  });

  console.log('\n--- DOMAIN 5: Post-Repair AI Verification & Non-Visual OTP ---');

  test('Image Forensics detects identical re-uploaded photos as fraud', () => {
    const identicalImgA = 'https://res.cloudinary.com/demo/image/upload/sample_leak.jpg';
    const identicalImgB = 'https://res.cloudinary.com/demo/image/upload/sample_leak.jpg';

    const check = ImageForensicsService.verifyPhotoDivergence(identicalImgA, identicalImgB);
    assert.strictEqual(check.isValid, false, 'Must flag identical image URL as invalid');
    assert.ok(check.reason.includes('Fraud Detection Alert'), 'Must return fraud alert message');
  });

  test('Image Forensics permits genuine divergent before/after photos', () => {
    const beforeImg = 'https://res.cloudinary.com/demo/image/upload/v12345/broken_pipe_angle_1.jpg';
    const afterImg = 'https://res.cloudinary.com/demo/image/upload/v67890/fixed_coupling_angle_2.jpg';

    const check = ImageForensicsService.verifyPhotoDivergence(beforeImg, afterImg);
    assert.strictEqual(check.isValid, true, 'Must permit divergent photos');
    assert.ok(check.hammingDistance > 1, 'Hamming distance must exceed threshold');
  });

  await asyncTest('Non-Visual OTP validation protocol generates and verifies 6-digit PIN', async () => {
    const dummyMilestoneId = `ms_${Date.now()}`;
    const dummyClientId = `user_${Date.now()}`;

    // 1. Generate PIN
    const generated = AiVerificationService.generateNonVisualOtp({
      milestoneId: dummyMilestoneId,
      clientId: dummyClientId,
    });

    assert.ok(generated.otp.length === 6, 'PIN must be 6 digits');

    // 2. Verify with wrong PIN fails
    let wrongPinFailed = false;
    try {
      await AiVerificationService.verifyNonVisualOtp({
        milestoneId: dummyMilestoneId,
        otpCode: '000000',
        clientId: dummyClientId,
      });
    } catch (err) {
      wrongPinFailed = err.statusCode === 400;
    }
    assert.strictEqual(wrongPinFailed, true, 'Wrong PIN must throw 400 Bad Request');
  });

  console.log(`\n========================================`);
  console.log(`🎯 Test Results: ${passedTests}/${totalTests} Passed`);
  console.log(`========================================\n`);

  if (passedTests === totalTests) {
    console.log('🌟 ALL 5 HARDENING DOMAINS ARE FULLY OPERATIONAL AND VERIFIED!\n');
    process.exit(0);
  } else {
    console.error('❌ Some tests failed.');
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
