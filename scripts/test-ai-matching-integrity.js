import prisma from '../src/config/db.js';
import { MatchingEngineService } from '../src/services/matching-engine.service.js';

console.log('====================================================');
console.log('🎯 TESTING 5-PILLAR MATCHING INTEGRITY & SNAPSHOT AUDIT');
console.log('====================================================\n');

async function testMatchingIntegrity() {
  let passedCount = 0;

  // Find or create a diagnostic session for plumbing in Lagos
  const plumbingCategory = await prisma.jobCategory.findFirst({
    where: { slug: { contains: 'plumbing', mode: 'insensitive' } },
  });

  if (!plumbingCategory) {
    console.error('❌ FAILED: Plumbing category not found in DB.');
    process.exit(1);
  }

  const session = await prisma.aiDiagnosticSession.create({
    data: {
      diagnosticTitle: 'Burst PPR Pipe in Lekki',
      probableCause: 'High pressure joint fissure',
      severity: 'HIGH',
      urgency: 'EMERGENCY',
      matchedCategoryId: plumbingCategory.id,
      clientLatitude: 6.4474,
      clientLongitude: 3.4731,
      clientAddress: 'Lekki Phase 1, Lagos',
    },
  });

  console.log(`Created test session: ${session.id}`);

  // 1. Test Matching Execution with Hard Filters & 5-Pillar Score
  console.log('\nTEST 1: 5-Pillar Matching Execution (Lekki Phase 1 Plumbing)...');
  const matchResult = await MatchingEngineService.findTopMatches({
    diagnosticSessionId: session.id,
    categoryId: plumbingCategory.id,
    clientLat: 6.4474,
    clientLng: 3.4731,
    clientState: 'Lagos',
    isEmergency: true,
    limit: 3,
  });

  console.log(`   Candidates Found: ${matchResult.candidates?.length || 0}`);
  if (matchResult.candidates?.length > 0) {
    const top = matchResult.candidates[0];
    console.log(`   Top Candidate: ${top.artisan.name}`);
    console.log(`   Rating: ${top.artisan.rating}★ | Match Score: ${top.matchScore} | KYC: ${top.artisan.kycVerified}`);
    console.log(`   Rationale: ${top.rationale}`);

    if (top.artisan.kycVerified && top.matchScore > 0) {
      console.log('✅ PASSED: Hard filter and composite scoring validated!');
      passedCount++;
    } else {
      console.error('❌ FAILED: Top candidate failed KYC or score criteria.');
      process.exit(1);
    }
  } else {
    console.warn('⚠️ No candidates found. Checking database seeding.');
  }

  // 2. Test MatchSnapshot Database Persistence
  console.log('\nTEST 2: MatchSnapshot Audit Verification in Database...');
  const snapshot = await prisma.matchSnapshot.findFirst({
    where: { diagnosticSessionId: session.id },
    orderBy: { createdAt: 'desc' },
  });

  if (snapshot) {
    console.log(`   Snapshot ID: ${snapshot.id}`);
    console.log(`   Ranking Policy: ${snapshot.rankingPolicy}`);
    console.log(`   Algorithm Version: ${snapshot.algorithmVersion}`);
    console.log(`   Recorded Candidates in Snapshot:`, snapshot.candidateSnapshot?.length || 0);

    if (snapshot.rankingPolicy === 'HARD_FILTER_THEN_COMPOSITE_SCORE' && snapshot.candidateSnapshot?.length > 0) {
      console.log('✅ PASSED: MatchSnapshot successfully recorded with full audit trail!');
      passedCount++;
    } else {
      console.error('❌ FAILED: MatchSnapshot data invalid:', snapshot);
      process.exit(1);
    }
  } else {
    console.error('❌ FAILED: No MatchSnapshot record created!');
    process.exit(1);
  }

  // 3. Test Zero Cross-Trade Guarantee (Negative Test: Query Electrical category with Plumber data)
  console.log('\nTEST 3: Zero Cross-Trade Isolation Test...');
  const electricalCategory = await prisma.jobCategory.findFirst({
    where: { slug: { contains: 'electrical', mode: 'insensitive' } },
  });

  if (electricalCategory) {
    const crossTradeMatch = await MatchingEngineService.findTopMatches({
      categoryId: electricalCategory.id,
      clientState: 'Lagos',
      limit: 3,
    });

    // Verify none of the candidates are plumbers
    const hasCrossTrade = crossTradeMatch.candidates.some((c) =>
      c.artisan.skills?.some((s) => s.toLowerCase().includes('plumb'))
    );

    if (!hasCrossTrade) {
      console.log('✅ PASSED: Zero cross-trade substitution strictly enforced!');
      passedCount++;
    } else {
      console.error('❌ FAILED: Cross-trade candidate contaminated results!');
      process.exit(1);
    }
  }

  // Clean up test session
  await prisma.aiDiagnosticSession.delete({ where: { id: session.id } });

  console.log(`\n🎉 ALL ${passedCount} MATCHING INTEGRITY TESTS PASSED!`);
  process.exit(0);
}

testMatchingIntegrity().catch((err) => {
  console.error('❌ Matching integrity test failed:', err.message);
  process.exit(1);
});
