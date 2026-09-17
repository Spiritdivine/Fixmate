import prisma from '../src/config/db.js';
import { DisputeService } from '../src/services/dispute.service.js';
import { EscrowService } from '../src/services/escrow.service.js';
import { TreasuryService } from '../src/services/treasury.service.js';

async function runDisputeLedgerTest() {
  console.log('⚖️ Starting Dispute Settlement & Ledger Integrity Test...');

  const timestamp = Date.now();

  // 1. Create client and artisan
  const [client, artisan] = await Promise.all([
    prisma.user.create({
      data: {
        email: `client_dsp_${timestamp}@test.com`,
        phoneNumber: `+23480${Math.floor(10000000 + Math.random() * 90000000)}`,
        passwordHash: 'dummy',
        role: 'CLIENT',
        wallet: { create: { availableBalance: 100000.00, escrowLockedBalance: 0.00 } },
      },
      include: { wallet: true },
    }),
    prisma.user.create({
      data: {
        email: `artisan_dsp_${timestamp}@test.com`,
        phoneNumber: `+23480${Math.floor(10000000 + Math.random() * 90000000)}`,
        passwordHash: 'dummy',
        role: 'ARTISAN',
        wallet: { create: { availableBalance: 5000.00, escrowLockedBalance: 0.00 } },
      },
      include: { wallet: true },
    }),
  ]);

  const treasuryWalletBefore = await TreasuryService.ensureTreasuryWallet(prisma);
  const treasuryBalanceBefore = Number(treasuryWalletBefore.availableBalance);

  let category = await prisma.jobCategory.findFirst();
  if (!category) {
    category = await prisma.jobCategory.create({
      data: { name: 'Carpentry & Woodwork', slug: 'carpentry-woodwork' },
    });
  }

  // 2. Create job and contract
  const job = await prisma.job.create({
    data: {
      clientId: client.id,
      categoryId: category.id,
      title: `Dispute Ledger Job ${timestamp}`,
      description: 'Test contract for dispute resolution ledger verification',
      budgetMin: 40000.00,
      budgetMax: 60000.00,
      state: 'Lagos',
      lgaCity: 'Ikeja',
      status: 'IN_PROGRESS',
    },
  });

  // 2b. Create proposal
  const proposal = await prisma.proposal.create({
    data: {
      jobId: job.id,
      artisanId: artisan.id,
      coverLetter: 'I can handle this project expertly.',
      bidAmount: 50000.00,
      estimatedDays: 5,
      status: 'ACCEPTED',
    },
  });

  const contract = await prisma.contract.create({
    data: {
      contractCode: `CTR-DSP-${timestamp}`,
      job: { connect: { id: job.id } },
      proposal: { connect: { id: proposal.id } },
      client: { connect: { id: client.id } },
      artisan: { connect: { id: artisan.id } },
      totalAmount: 50000.00,
      platformFeePercent: 5.0,
      platformFeeAmount: 2500.00,
      status: 'ACTIVE',
      milestones: {
        create: {
          stepOrder: 1,
          title: 'Full Milestone',
          description: 'Single milestone',
          amount: 50000.00,
          status: 'PENDING_FUNDING',
        },
      },
    },
    include: { milestones: true },
  });

  const milestone = contract.milestones[0];

  // 3. Fund milestone into escrow
  console.log('💰 Client funding milestone with ₦50,000...');
  await EscrowService.fundMilestone(client.id, milestone.id);

  const clientWalletAfterFund = await prisma.wallet.findUnique({ where: { userId: client.id } });
  console.log(`   Client Available: ₦${Number(clientWalletAfterFund.availableBalance).toLocaleString()}`);
  console.log(`   Client Locked in Escrow: ₦${Number(clientWalletAfterFund.escrowLockedBalance).toLocaleString()}`);

  if (Number(clientWalletAfterFund.escrowLockedBalance) !== 50000) {
    throw new Error('Client escrowLockedBalance should be 50,000 after funding');
  }

  // 4. File a dispute
  console.log('🚨 Filing dispute on milestone...');
  const dispute = await DisputeService.fileDispute(client.id, {
    contractId: contract.id,
    milestoneId: milestone.id,
    reason: 'Deliverable quality issue',
    explanation: 'Seeking 50/50 split resolution',
  });
  console.log(`   Dispute created: #${dispute.disputeCode}`);

  // 5. Admin resolves dispute with 50/50 split
  // ₦25,000 refund to client, ₦25,000 artisan payout
  console.log('⚖️ Resolving dispute: ₦25,000 Client Refund, ₦25,000 Artisan Payout...');
  await DisputeService.resolveDispute(client.id, dispute.id, {
    resolution: 'SPLIT_SETTLEMENT',
    refundToClientAmount: 25000.00,
    payoutToArtisanAmount: 25000.00,
    adminResolutionNotes: 'Approved 50/50 compromise settlement',
  });

  // 6. Verify Balances & Zero Escrow Leak
  const [clientWalletFinal, artisanWalletFinal, treasuryWalletFinal] = await Promise.all([
    prisma.wallet.findUnique({ where: { userId: client.id } }),
    prisma.wallet.findUnique({ where: { userId: artisan.id } }),
    prisma.wallet.findUnique({ where: { id: treasuryWalletBefore.id } }),
  ]);

  console.log('\n📊 Ledger Verification Results:');
  console.log(`   Client Final Available: ₦${Number(clientWalletFinal.availableBalance).toLocaleString()} (Expected: 75,000)`);
  console.log(`   Client Final Locked:    ₦${Number(clientWalletFinal.escrowLockedBalance).toLocaleString()} (Expected: 0)`);
  console.log(`   Artisan Final Available: ₦${Number(artisanWalletFinal.availableBalance).toLocaleString()} (Expected: 28,750: 5000 initial + 25000 - 5% fee)`);
  console.log(`   Treasury Final Available: ₦${Number(treasuryWalletFinal.availableBalance).toLocaleString()} (Expected: +₦1,250 fee earned)`);

  // Assertions
  if (Number(clientWalletFinal.escrowLockedBalance) !== 0) {
    throw new Error(`ESCROW LEAK DETECTED! Client still has ₦${clientWalletFinal.escrowLockedBalance} locked`);
  }
  if (Number(clientWalletFinal.availableBalance) !== 75000) {
    throw new Error(`Client available balance mismatch: expected 75,000, got ${clientWalletFinal.availableBalance}`);
  }
  if (Number(artisanWalletFinal.availableBalance) !== 28750) {
    throw new Error(`Artisan balance mismatch: expected 28,750, got ${artisanWalletFinal.availableBalance}`);
  }
  if (Number(treasuryWalletFinal.availableBalance) !== treasuryBalanceBefore + 1250) {
    throw new Error(`Treasury fee mismatch: expected ${treasuryBalanceBefore + 1250}, got ${treasuryWalletFinal.availableBalance}`);
  }

  // 7. Verify Transaction History
  const [clientTx, artisanTx, treasuryTx] = await Promise.all([
    prisma.transaction.findFirst({
      where: { walletId: clientWalletFinal.id, type: 'ESCROW_REFUND' },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.transaction.findFirst({
      where: { walletId: artisanWalletFinal.id, type: 'ESCROW_RELEASE' },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.transaction.findFirst({
      where: { walletId: treasuryWalletFinal.id, type: 'PLATFORM_FEE' },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  console.log('\n🧾 Audit Trail Verification:');
  console.log(`   ✅ Client Refund Transaction: ${clientTx?.reference} (Amount: ₦${clientTx?.amount})`);
  console.log(`   ✅ Artisan Payout Transaction: ${artisanTx?.reference} (Net: ₦${artisanTx?.netAmount}, Fee: ₦${artisanTx?.fee})`);
  console.log(`   ✅ Treasury Fee Transaction:   ${treasuryTx?.reference} (Amount: ₦${treasuryTx?.amount})`);

  if (!clientTx || !artisanTx || !treasuryTx) {
    throw new Error('Missing transaction audit records for dispute settlement!');
  }

  // Cleanup test entities to maintain database cleanliness
  await prisma.disputeMessage.deleteMany({ where: { disputeId: dispute.id } });
  await prisma.dispute.deleteMany({ where: { contractId: contract.id } });
  await prisma.transaction.deleteMany({ where: { walletId: { in: [client.wallet.id, artisan.wallet.id] } } });
  await prisma.milestone.deleteMany({ where: { contractId: contract.id } });
  await prisma.contract.deleteMany({ where: { id: contract.id } });
  await prisma.proposal.deleteMany({ where: { jobId: job.id } });
  await prisma.job.deleteMany({ where: { id: job.id } });
  await prisma.wallet.deleteMany({ where: { userId: { in: [client.id, artisan.id] } } });
  await prisma.user.deleteMany({ where: { id: { in: [client.id, artisan.id] } } });

  console.log('   🧹 Test data cleaned up successfully.');

  console.log('\n🎉 ALL DISPUTE & TREASURY LEDGER TESTS PASSED WITH 100% PRECISION!');
}

runDisputeLedgerTest()
  .catch((err) => {
    console.error('❌ Dispute Ledger Test Failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
