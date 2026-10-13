import prisma from '../src/config/db.js';
import { BomPricingService } from '../src/services/bom-pricing.service.js';

console.log('====================================================');
console.log('🏷️ TESTING PRICE GROUNDING & PROVENANCE ENGINE');
console.log('====================================================\n');

async function testPriceGrounding() {
  let passedCount = 0;

  // 1. Test Grounded Item with Active Database Observation
  console.log('TEST 1: Grounded Item Lookup (PVC Pipe in Lagos)...');
  const inputBOM = [
    {
      item: 'Pressure PVC Pipe 3/4"',
      specification: 'PN16',
      quantity: 2,
      unit: 'PCS',
      estimatedCostMin: 1000, // will be overridden by verified observation (1800 * 2 = 3600)
      estimatedCostMax: 2000,
      marketCategory: 'PLUMBING',
    },
  ];

  const grounded = await BomPricingService.adjustBomToMarket({
    bomItems: inputBOM,
    state: 'Lagos',
    city: 'Ikeja',
    tradeCategory: 'plumbing-and-pipefitting',
  });

  const pipeItem = grounded[0];
  console.log('   Result:', pipeItem);

  if (
    pipeItem.estimatedCostMin === 3600 &&
    pipeItem.sourceReference?.includes('Oko-Awo') &&
    pipeItem.provenanceId
  ) {
    console.log('✅ PASSED: Sourced price observation successfully applied with provenance!');
    passedCount++;
  } else {
    console.error('❌ FAILED: Expected grounded price from observation, received:', pipeItem);
    process.exit(1);
  }

  // 2. Test Fallback with Regional Multiplier when no observation exists
  console.log('\nTEST 2: Regional Index Fallback (Rare item without observation)...');
  const fallbackBOM = [
    {
      item: 'Custom Imported Industrial Boiler Gasket',
      specification: 'Specialty Silicon',
      quantity: 1,
      unit: 'PCS',
      estimatedCostMin: 10000,
      estimatedCostMax: 15000,
      marketCategory: 'HARDWARE',
    },
  ];

  const adjustedFallback = await BomPricingService.adjustBomToMarket({
    bomItems: fallbackBOM,
    state: 'Lagos',
    city: 'Lagos',
    tradeCategory: 'general',
  });

  const fallbackItem = adjustedFallback[0];
  console.log('   Result:', fallbackItem);

  if (
    fallbackItem.isPriceIndexed &&
    fallbackItem.estimatedCostMin >= 12000 &&
    !fallbackItem.sourceReference
  ) {
    console.log('✅ PASSED: Regional multiplier accurately applied with indicative disclaimer!');
    passedCount++;
  } else {
    console.error('❌ FAILED: Expected regional index adjustment, received:', fallbackItem);
    process.exit(1);
  }

  // 3. Test Stale Record Suppression (>90 days expired)
  console.log('\nTEST 3: Stale Record Suppression...');
  const expiredDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
  const staleObs = await prisma.priceObservation.create({
    data: {
      itemId: 'stale_test_part',
      itemDescription: 'Stale Obsolete Brass Nipple',
      categorySlug: 'plumbing-and-pipefitting',
      locality: 'Lagos',
      minPriceNgn: 99999,
      maxPriceNgn: 99999,
      currency: 'NGN',
      sourceType: 'MERCHANT_CATALOGUE',
      sourceReference: 'Ancient Survey',
      observedAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
      verifiedAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
      expiresAt: expiredDate,
    },
  });

  const staleTestBOM = [
    {
      item: 'Stale Obsolete Brass Nipple',
      quantity: 1,
      estimatedCostMin: 2000,
      estimatedCostMax: 3000,
    },
  ];

  const staleResult = await BomPricingService.adjustBomToMarket({
    bomItems: staleTestBOM,
    state: 'Lagos',
    city: 'Lagos',
  });

  // Clean up test observation
  await prisma.priceObservation.delete({ where: { id: staleObs.id } });

  if (staleResult[0].estimatedCostMin !== 99999) {
    console.log('✅ PASSED: Expired price observation correctly suppressed!');
    passedCount++;
  } else {
    console.error('❌ FAILED: Stale price was improperly applied!');
    process.exit(1);
  }

  console.log(`\n🎉 ALL ${passedCount} PRICE GROUNDING TESTS PASSED!`);
  process.exit(0);
}

testPriceGrounding().catch((err) => {
  console.error('❌ Price grounding test failed:', err.message);
  process.exit(1);
});
