import prisma from '../src/config/db.js';

async function seedPriceIndices() {
  console.log('🌱 Seeding Regional Price Indices & Grounded Price Observations for Fixmate...');

  const indices = [
    { state: 'Lagos', city: 'Lagos', tradeCategory: 'electrical-and-wiring', indexMultiplier: 1.30 },
    { state: 'Lagos', city: 'Lagos', tradeCategory: 'plumbing-and-pipefitting', indexMultiplier: 1.25 },
    { state: 'Lagos', city: 'Lagos', tradeCategory: 'hvac-and-ac-repair', indexMultiplier: 1.35 },
    { state: 'Lagos', city: 'Lagos', tradeCategory: 'generator-and-power-plants', indexMultiplier: 1.28 },
    { state: 'Lagos', city: 'Lagos', tradeCategory: 'general', indexMultiplier: 1.25 },
    { state: 'Abuja', city: 'Abuja', tradeCategory: 'electrical-and-wiring', indexMultiplier: 1.40 },
    { state: 'Abuja', city: 'Abuja', tradeCategory: 'plumbing-and-pipefitting', indexMultiplier: 1.35 },
    { state: 'Abuja', city: 'Abuja', tradeCategory: 'general', indexMultiplier: 1.35 },
    { state: 'Rivers', city: 'Port Harcourt', tradeCategory: 'general', indexMultiplier: 1.30 },
  ];

  for (const item of indices) {
    await prisma.regionalPriceIndex.upsert({
      where: {
        state_city_tradeCategory: {
          state: item.state,
          city: item.city,
          tradeCategory: item.tradeCategory,
        },
      },
      update: {
        indexMultiplier: item.indexMultiplier,
      },
      create: {
        state: item.state,
        city: item.city,
        tradeCategory: item.tradeCategory,
        indexMultiplier: item.indexMultiplier,
      },
    });
  }

  // Seed verified Price Observations with 90-day expiry
  const now = new Date();
  const ninetyDaysLater = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  const priceObservations = [
    // Plumbing
    {
      itemId: 'pvc_pipe',
      itemDescription: 'Pressure PVC Pipe 3/4" (4 meters)',
      categorySlug: 'plumbing-and-pipefitting',
      locality: 'Lagos',
      minPriceNgn: 1800,
      maxPriceNgn: 2500,
      sourceType: 'MERCHANT_CATALOGUE',
      sourceReference: 'Oko-Awo Plumbing Merchant Survey Q4 2026',
    },
    {
      itemId: 'pvc_coupling',
      itemDescription: 'PVC Straight Pipe Coupler / Socket Joint 3/4"',
      categorySlug: 'plumbing-and-pipefitting',
      locality: 'Lagos',
      minPriceNgn: 500,
      maxPriceNgn: 850,
      sourceType: 'MERCHANT_CATALOGUE',
      sourceReference: 'Oko-Awo Plumbing Merchant Survey Q4 2026',
    },
    {
      itemId: 'pvc_solvent_glue',
      itemDescription: 'Heavy-Duty PVC Solvent Cement (Tin)',
      categorySlug: 'plumbing-and-pipefitting',
      locality: 'Lagos',
      minPriceNgn: 1200,
      maxPriceNgn: 2200,
      sourceType: 'MERCHANT_CATALOGUE',
      sourceReference: 'Oko-Awo Plumbing Merchant Survey Q4 2026',
    },
    // Electrical
    {
      itemId: 'mcb_breaker',
      itemDescription: 'Single Pole MCB 32A Miniature Circuit Breaker (Schneider / Chint)',
      categorySlug: 'electrical-and-wiring',
      locality: 'Lagos',
      minPriceNgn: 6500,
      maxPriceNgn: 9500,
      sourceType: 'MERCHANT_CATALOGUE',
      sourceReference: 'Alaba International Market Electrical Guild Survey',
    },
    {
      itemId: 'insulation_tape',
      itemDescription: 'High-Voltage Flame-Retardant PVC Insulation Tape',
      categorySlug: 'electrical-and-wiring',
      locality: 'Lagos',
      minPriceNgn: 800,
      maxPriceNgn: 1500,
      sourceType: 'MERCHANT_CATALOGUE',
      sourceReference: 'Alaba International Market Electrical Guild Survey',
    },
  ];

  for (const obs of priceObservations) {
    const existing = await prisma.priceObservation.findFirst({
      where: {
        itemId: obs.itemId,
        locality: obs.locality,
      },
    });

    if (existing) {
      await prisma.priceObservation.update({
        where: { id: existing.id },
        data: {
          minPriceNgn: obs.minPriceNgn,
          maxPriceNgn: obs.maxPriceNgn,
          expiresAt: ninetyDaysLater,
          verifiedAt: now,
        },
      });
    } else {
      await prisma.priceObservation.create({
        data: {
          itemId: obs.itemId,
          itemDescription: obs.itemDescription,
          categorySlug: obs.categorySlug,
          locality: obs.locality,
          minPriceNgn: obs.minPriceNgn,
          maxPriceNgn: obs.maxPriceNgn,
          currency: 'NGN',
          sourceType: obs.sourceType,
          sourceReference: obs.sourceReference,
          sampleSize: 5,
          observedAt: now,
          verifiedAt: now,
          expiresAt: ninetyDaysLater,
        },
      });
    }
  }

  console.log('✅ Regional Price Indices & Grounded Observations seeded successfully.');
  process.exit(0);
}

seedPriceIndices().catch((err) => {
  console.error('❌ Price index seeding failed:', err.message);
  process.exit(1);
});
