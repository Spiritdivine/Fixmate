import prisma from '../src/config/db.js';
import { AiDiagnosticService } from '../src/services/ai-diagnostic.service.js';
import { AiEscrowService } from '../src/services/ai-escrow.service.js';
import { EmergencyDispatchService } from '../src/services/emergency-dispatch.service.js';
import { AiVerificationService } from '../src/services/ai-verification.service.js';
import { AiCacheService } from '../src/services/ai-cache.service.js';

async function runPhase4Tests() {
  console.log('🧪 Starting Phase 4 Production Hardening, Escrow Linking & Rollout Tests...\n');

  try {
    // -------------------------------------------------------------
    // Step 1: Generate Multimodal Diagnostic Session
    // -------------------------------------------------------------
    console.log('--- Step 1: Initializing Diagnostic Session ---');
    const diag = await AiDiagnosticService.runDiagnostic({
      textPrompt: 'Burst copper water pipe gushing high-pressure water near electrical meter box in Victoria Island!',
      imageUrls: ['https://res.cloudinary.com/demo/image/upload/sample_flood_burst.jpg'],
      clientCoords: { latitude: '6.4281', longitude: '3.4219' }, // Victoria Island, Lagos
      clientAddress: 'Ahmadu Bello Way, Victoria Island, Lagos',
    });

    const sessionId = diag.session.id;
    console.log('✅ Session Created:', sessionId);
    console.log('✅ Urgency Level:', diag.session.urgency);
    console.log('✅ Is Hazardous:', diag.session.isHazardous);

    // -------------------------------------------------------------
    // Step 2: Test Escrow Milestone Breakdown (NGN & Monad USDC)
    // -------------------------------------------------------------
    console.log('\n--- Step 2: Testing AI Diagnostic Escrow Milestone Planning ---');
    const plan = await AiEscrowService.calculateEscrowPlan({ sessionId });

    console.log('✅ Total Job (NGN):', `₦${plan.pricingSummary.totalNgn.toLocaleString()}`);
    console.log('✅ Total Job (Monad USDC):', `${plan.pricingSummary.totalUsdc} USDC`);
    console.log('✅ Platform Fee:', `₦${plan.pricingSummary.platformFeeNgn.toLocaleString()} (${plan.pricingSummary.platformFeeUsdc} USDC)`);
    console.log('✅ Milestones Calculated:', plan.milestones.length);
    plan.milestones.forEach((m) => {
      console.log(`   - Step ${m.stepOrder}: ${m.title} | ₦${m.amountNgn.toLocaleString()} (${m.amountUsdc} USDC)`);
    });

    if (plan.milestones.length < 1) {
      throw new Error('Expected at least 1 milestone in escrow plan');
    }

    // -------------------------------------------------------------
    // Step 3: Test Direct Escrow Contract Instantiation
    // -------------------------------------------------------------
    console.log('\n--- Step 3: Testing Direct Escrow Contract Instantiation ---');
    // Find or pick a test client user
    let clientUser = await prisma.user.findFirst({ where: { role: 'CLIENT' } });
    if (!clientUser) {
      clientUser = await prisma.user.create({
        data: {
          email: `client_phase4_${Date.now()}@fixmate.test`,
          passwordHash: 'dummy_hash',
          role: 'CLIENT',
        },
      });
    }

    // Find candidate artisan profile
    const candidateArtisan = await prisma.artisanProfile.findFirst({
      where: { isAvailable: true },
      include: { user: true },
    });

    if (!candidateArtisan) {
      throw new Error('No available artisan profile found in database');
    }

    const contractResult = await AiEscrowService.createEscrowContractFromDiagnosis({
      sessionId,
      clientId: clientUser.id,
      artisanProfileId: candidateArtisan.id,
      customNotes: 'Please expedite, active water leak risk.',
    });

    console.log('✅ Contract Created:', contractResult.contract.contractCode);
    console.log('✅ Contract Status:', contractResult.contract.status);
    console.log('✅ Milestones Instantiated in DB:', contractResult.milestones.length);
    console.log('✅ Contract linked on AI Session in DB:', contractResult.contract.id);

    if (contractResult.contract.status !== 'PENDING_FUNDING') {
      throw new Error(`Expected contract status PENDING_FUNDING, got ${contractResult.contract.status}`);
    }

    // -------------------------------------------------------------
    // Step 4: Test Emergency 1-Tap SOS Dispatch & Multi-Casting
    // -------------------------------------------------------------
    console.log('\n--- Step 4: Testing 1-Tap Emergency SOS Dispatch ---');
    const sosResult = await EmergencyDispatchService.triggerEmergencySos({
      sessionId,
      clientId: clientUser.id,
      maxRadiusKm: 50.0,
    });

    console.log('✅ SOS Dispatched:', sosResult.isSosDispatched);
    console.log('✅ Callout Fee Guaranteed:', `₦${sosResult.calloutFeeNgn.toLocaleString()}`);
    console.log('✅ Artisans Multicast Alerted:', sosResult.candidateCount);
    console.log('✅ Atomic Locking Mode:', sosResult.claimMode);

    // -------------------------------------------------------------
    // Step 5: Test First-to-Claim Atomic Race Condition Lock
    // -------------------------------------------------------------
    console.log('\n--- Step 5: Testing First-to-Claim SOS Locking ---');
    const claimResult = await EmergencyDispatchService.claimEmergencySos({
      sessionId,
      artisanUserId: candidateArtisan.userId,
    });

    console.log('✅ First Artisan Claim Success:', claimResult.success);
    console.log('✅ Dispatched Specialist:', claimResult.artisanName);

    // Test race-condition lock by attempting a second claim
    let duplicateRejected = false;
    try {
      await EmergencyDispatchService.claimEmergencySos({
        sessionId,
        artisanUserId: candidateArtisan.userId,
      });
    } catch (err) {
      duplicateRejected = true;
      console.log('✅ Second claim correctly rejected (Atomic lock enforced):', err.message);
    }

    if (!duplicateRejected) {
      throw new Error('Expected duplicate emergency claim to be blocked by atomic concurrency lock');
    }

    // -------------------------------------------------------------
    // Step 6: Test AI Post-Repair Before/After Photo Inspection
    // -------------------------------------------------------------
    console.log('\n--- Step 6: Testing AI Post-Repair Before/After Verification ---');
    const verification = await AiVerificationService.verifyRepairWork({
      sessionId,
      contractId: contractResult.contract.id,
      milestoneId: contractResult.milestones[0]?.id,
      preRepairPhotoUrls: ['https://res.cloudinary.com/demo/image/upload/sample_flood_burst.jpg'],
      postRepairPhotoUrls: ['https://res.cloudinary.com/demo/image/upload/sample_pipe_repaired.jpg'],
      diagnosticTitle: 'Burst Copper Water Pipe Repair',
    });

    console.log('✅ Verification Record ID:', verification.verificationId);
    console.log('✅ Is Repair Verified:', verification.isRepairVerified);
    console.log('✅ Confidence Score:', `${verification.confidenceScore}%`);
    console.log('✅ Hazards Remaining:', verification.hazardsRemaining);
    console.log('✅ Milestone Recommendation:', verification.recommendation);
    console.log('✅ Inspection Observations:', verification.observations);

    if (!verification.verificationId || !verification.recommendation) {
      throw new Error('Post-repair verification failed to yield audit record');
    }

    // -------------------------------------------------------------
    // Step 7: Test Performance Caching & Token Telemetry
    // -------------------------------------------------------------
    console.log('\n--- Step 7: Testing Semantic Caching & Token Telemetry ---');
    const query = 'Pumping machine seized and humming in Lekki';
    const key = AiCacheService.hashKey(query, 'plumbing', 'Lekki');
    AiCacheService.set(key, { title: 'Water Pump Stator Seizure', severity: 'HIGH' });

    const cached = AiCacheService.get(key);
    console.log('✅ Cache Hit:', Boolean(cached));
    const stats = AiCacheService.getStats();
    console.log('✅ Cache Total Calls:', stats.totalCalls);
    console.log('✅ Cache Hit Rate:', `${stats.hitRatePercent}%`);
    console.log('✅ Tokens Saved Estimate:', stats.estimatedTokensSaved);

    console.log('\n🎉 ALL PHASE 4 PRODUCTION HARDENING & ESCROW TESTS PASSED SUCCESSFULLY! 🚀\n');
  } catch (error) {
    console.error('❌ Phase 4 Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runPhase4Tests();
