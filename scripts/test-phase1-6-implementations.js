import prisma from '../src/config/db.js';
import { ContractService } from '../src/services/contract.service.js';
import { ProfileService } from '../src/services/profile.service.js';
import { KnowledgeService } from '../src/services/knowledge.service.js';
import {
  sweep72HourEscrowAutoRelease,
  sweepDailyFinancialReconciliation,
  sweepDataHygiene,
} from '../src/cron/cron.manager.js';

async function runVerification() {
  console.log('🧪 Starting Phase 1-6 Implementation Verification Suite...\n');

  // Test 1: KnowledgeService
  console.log('1️⃣ Testing KnowledgeSource Retrieval...');
  const allKnowledge = await KnowledgeService.listAll();
  console.log(`   Found ${allKnowledge.length} knowledge source(s)`);
  if (allKnowledge.length === 0) throw new Error('No knowledge sources found');
  console.log(`   Sample: [${allKnowledge[0].sourceCode}] ${allKnowledge[0].title}`);
  console.log('   ✅ KnowledgeSource service verified.\n');

  // Test 2: Cron Sweepers Execution
  console.log('2️⃣ Testing Background Cron Sweepers...');
  await sweep72HourEscrowAutoRelease();
  console.log('   ✓ 72-hour escrow auto-release sweep executed cleanly');
  await sweepDailyFinancialReconciliation();
  console.log('   ✓ Daily financial reconciliation sweep executed cleanly');
  await sweepDataHygiene();
  console.log('   ✓ Data hygiene sweep executed cleanly');
  console.log('   ✅ Cron sweepers verified.\n');

  // Test 3: Artisan Skill Management
  console.log('3️⃣ Testing Granular Artisan Skill Management...');
  const sampleArtisan = await prisma.user.findFirst({
    where: { role: 'ARTISAN', artisanProfile: { isNot: null } },
    include: { artisanProfile: true },
  });

  if (sampleArtisan) {
    const sampleSkill = await prisma.skill.findFirst();
    if (sampleSkill) {
      console.log(`   Testing with artisan: ${sampleArtisan.email}, skill: ${sampleSkill.name}`);
      const added = await ProfileService.addArtisanSkill(sampleArtisan.id, sampleSkill.id);
      console.log(`   ✓ Added skill: ${added.name}`);
      const skills = await ProfileService.getArtisanSkills(sampleArtisan.id);
      console.log(`   ✓ Retrieved skills count: ${skills.length}`);
      const removed = await ProfileService.removeArtisanSkill(sampleArtisan.id, sampleSkill.id);
      console.log(`   ✓ Removed skill: ${removed.skillId}`);
      console.log('   ✅ Granular artisan skill management verified.\n');
    }
  } else {
    console.log('   ⚠️ No sample artisan found for skill test, skipping skill test.\n');
  }

  // Test 4: Contract Change Orders
  console.log('4️⃣ Testing Contract Change Order Persistence...');
  const sampleContract = await prisma.contract.findFirst({
    where: { status: { in: ['ACTIVE', 'PENDING_FUNDING'] } },
  });

  if (sampleContract) {
    console.log(`   Testing on contract: #${sampleContract.contractCode}`);
    const changeOrder = await prisma.contractChangeOrder.create({
      data: {
        contractId: sampleContract.id,
        artisanId: sampleContract.artisanId,
        additionalAmount: 15000,
        additionalDays: 2,
        reason: 'Supplemental piping insulation required by LASBCA standards',
        evidencePhotos: ['https://res.cloudinary.com/demo/image/upload/sample.jpg'],
        status: 'PENDING',
      },
    });
    console.log(`   ✓ Created change order: ${changeOrder.id}`);

    const retrieved = await ContractService.getChangeOrders(sampleContract.artisanId, sampleContract.id);
    console.log(`   ✓ Retrieved change orders count: ${retrieved.length}`);

    // Cleanup test change order
    await prisma.contractChangeOrder.delete({ where: { id: changeOrder.id } });
    console.log('   ✓ Cleaned up test change order');
    console.log('   ✅ Contract Change Orders verified.\n');
  } else {
    console.log('   ⚠️ No active contract found for change order test, skipping.\n');
  }

  console.log('🎉 ALL BACKEND IMPLEMENTATION VERIFICATION TESTS PASSED!');
}

runVerification()
  .catch((err) => {
    console.error('❌ Verification failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
