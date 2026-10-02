import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TEST_ACCOUNT_EMAILS = [
  'test-client-1790846570905@example.com',
  'test-artisan-1790846570905@example.com',
  'test-client-1790846849419@example.com',
  'test-artisan-1790846849419@example.com',
  'test-client-1790847126177@example.com',
  'test-artisan-1790847126177@example.com',
  'test-client-1790902202896@example.com',
  'test-artisan-1790902202896@example.com',
  'gas-test-1790902750730@example.com',
  'gas-test-1790902845979@example.com',
  'test-client-1790902977689@example.com',
  'test-artisan-1790902977689@example.com',
  'tunde.privy.1790908100@example.com',
  'auto.wallet.1790909725228@example.com',
  'browser.verify.1790909847@example.com',
  'amina.monad.1775102900@example.com',
  'privy_live_99@monadtest.com',
  'privy_autogen_100@artifix.org',
  'test_node_reg_1790931676785@artifix.org',
  'privy_live_check_200@artifix.org',
  'client_privy_auto_300@artifix.org',
  'privy_verified_final_test@artifix.org',
  'nou261104841@noun.edu.ng'
];

// Explicit allowlist of accounts that MUST NEVER be deleted
const PROTECTED_EMAILS = [
  'admin@artisanplatform.com',
  'treasury@artifixhq.xyz',
  'artisan@fixmate.ng',
  'client@fixmate.ng',
  'spiritdivine777@gmail.com',
  'topgarner99@gmail.com',
  '01spiritdivine@gmail.com',
  'liljoekentix24@gmail.com',
  'muhammadsuleimanjibril22@gmail.com'
];

async function main() {
  console.log('🧹 Starting cleanup of test accounts and related test artifacts...');

  // 1. Fetch test users
  const testUsers = await prisma.user.findMany({
    where: {
      email: { in: TEST_ACCOUNT_EMAILS },
      NOT: { email: { in: PROTECTED_EMAILS } }
    },
    select: {
      id: true,
      email: true,
      role: true
    }
  });

  const testUserIds = testUsers.map(u => u.id);
  console.log(`Found ${testUsers.length} test accounts to remove.`);

  if (testUserIds.length === 0) {
    console.log('No test accounts found to delete.');
    return;
  }

  // 2. Find contracts involving test users
  const testContracts = await prisma.contract.findMany({
    where: {
      OR: [
        { clientId: { in: testUserIds } },
        { artisanId: { in: testUserIds } }
      ]
    },
    select: { id: true, contractCode: true }
  });
  const testContractIds = testContracts.map(c => c.id);
  console.log(`Found ${testContractIds.length} test contracts to remove.`);

  // 3. Find jobs posted by test clients
  const testJobs = await prisma.job.findMany({
    where: {
      clientId: { in: testUserIds }
    },
    select: { id: true, title: true }
  });
  const testJobIds = testJobs.map(j => j.id);
  console.log(`Found ${testJobIds.length} test jobs to remove.`);

  // 4. Find proposals submitted by test artisans or for test jobs
  const testProposals = await prisma.proposal.findMany({
    where: {
      OR: [
        { artisanId: { in: testUserIds } },
        { jobId: { in: testJobIds } }
      ]
    },
    select: { id: true }
  });
  const testProposalIds = testProposals.map(p => p.id);
  console.log(`Found ${testProposalIds.length} test proposals to remove.`);

  // Find wallets of test users
  const testWallets = await prisma.wallet.findMany({
    where: { userId: { in: testUserIds } },
    select: { id: true }
  });
  const testWalletIds = testWallets.map(w => w.id);

  // Execute deletion in a strict transaction
  await prisma.$transaction(async (tx) => {
    // 1. Transactions related to test contracts or test wallets
    console.log('1. Deleting transactions...');
    await tx.transaction.deleteMany({
      where: {
        OR: [
          { contractId: { in: testContractIds } },
          { walletId: { in: testWalletIds } }
        ]
      }
    });

    // 2. Disputes & Dispute messages / evidence
    console.log('2. Deleting disputes...');
    const disputes = await tx.dispute.findMany({
      where: {
        OR: [
          { contractId: { in: testContractIds } },
          { initiatedByUserId: { in: testUserIds } }
        ]
      },
      select: { id: true }
    });
    const disputeIds = disputes.map(d => d.id);
    if (disputeIds.length > 0) {
      await tx.disputeMessage.deleteMany({ where: { disputeId: { in: disputeIds } } });
      await tx.disputeEvidence.deleteMany({ where: { disputeId: { in: disputeIds } } });
      await tx.dispute.deleteMany({ where: { id: { in: disputeIds } } });
    }

    // 3. Reviews involving test users or test contracts
    console.log('3. Deleting reviews...');
    await tx.review.deleteMany({
      where: {
        OR: [
          { contractId: { in: testContractIds } },
          { reviewerId: { in: testUserIds } },
          { revieweeId: { in: testUserIds } }
        ]
      }
    });

    // 4. Contract Milestones & Contracts
    console.log('4. Deleting milestones & contracts...');
    if (testContractIds.length > 0) {
      await tx.milestone.deleteMany({ where: { contractId: { in: testContractIds } } });
      await tx.contract.deleteMany({ where: { id: { in: testContractIds } } });
    }

    // 5. Proposal Milestones & Proposals
    console.log('5. Deleting proposal milestones & proposals...');
    if (testProposalIds.length > 0) {
      await tx.proposalMilestone.deleteMany({ where: { proposalId: { in: testProposalIds } } });
      await tx.proposal.deleteMany({ where: { id: { in: testProposalIds } } });
    }

    // 6. Job related records & Jobs
    console.log('6. Deleting jobs & related items...');
    await tx.jobInvitation.deleteMany({
      where: {
        OR: [
          { jobId: { in: testJobIds } },
          { artisanId: { in: testUserIds } }
        ]
      }
    });
    await tx.savedJob.deleteMany({
      where: {
        OR: [
          { jobId: { in: testJobIds } },
          { userId: { in: testUserIds } }
        ]
      }
    });
    if (testJobIds.length > 0) {
      await tx.jobSkill.deleteMany({ where: { jobId: { in: testJobIds } } });
      await tx.jobAttachment.deleteMany({ where: { jobId: { in: testJobIds } } });
      await tx.job.deleteMany({ where: { id: { in: testJobIds } } });
    }

    // 7. Conversations & Messages
    console.log('7. Deleting chat conversations & messages...');
    const userConversations = await tx.conversationParticipant.findMany({
      where: { userId: { in: testUserIds } },
      select: { conversationId: true }
    });
    const convIds = [...new Set(userConversations.map(c => c.conversationId))];
    if (convIds.length > 0) {
      await tx.message.deleteMany({ where: { conversationId: { in: convIds } } });
      await tx.conversationParticipant.deleteMany({ where: { conversationId: { in: convIds } } });
      await tx.conversation.deleteMany({ where: { id: { in: convIds } } });
    }
    await tx.message.deleteMany({ where: { senderId: { in: testUserIds } } });

    // 8. Financial items: PayoutRequests first, then BankAccounts, SavedPaymentMethods, Wallets
    console.log('8. Deleting payout requests, bank accounts, and wallets...');
    await tx.payoutRequest.deleteMany({ where: { userId: { in: testUserIds } } });
    await tx.bankAccount.deleteMany({ where: { userId: { in: testUserIds } } });
    await tx.savedPaymentMethod.deleteMany({ where: { userId: { in: testUserIds } } });
    if (testWalletIds.length > 0) {
      await tx.wallet.deleteMany({ where: { id: { in: testWalletIds } } });
    }

    // 9. Profiles, skills, services, portfolios
    console.log('9. Deleting artisan & client profiles...');
    const artisanProfiles = await tx.artisanProfile.findMany({
      where: { userId: { in: testUserIds } },
      select: { id: true }
    });
    const profileIds = artisanProfiles.map(p => p.id);
    if (profileIds.length > 0) {
      await tx.artisanSkill.deleteMany({ where: { artisanProfileId: { in: profileIds } } });
      await tx.artisanService.deleteMany({ where: { artisanProfileId: { in: profileIds } } });
      await tx.artisanPortfolio.deleteMany({ where: { artisanProfileId: { in: profileIds } } });
      await tx.savedArtisan.deleteMany({ where: { artisanProfileId: { in: profileIds } } });
      await tx.artisanProfile.deleteMany({ where: { id: { in: profileIds } } });
    }
    await tx.savedArtisan.deleteMany({ where: { userId: { in: testUserIds } } });
    await tx.clientProfile.deleteMany({ where: { userId: { in: testUserIds } } });
    await tx.kycVerification.deleteMany({ where: { userId: { in: testUserIds } } });

    // 10. Sessions, notifications, logs
    console.log('10. Deleting sessions, notifications, logs...');
    await tx.notification.deleteMany({ where: { userId: { in: testUserIds } } });
    await tx.pushSubscription.deleteMany({ where: { userId: { in: testUserIds } } });
    await tx.auditLog.deleteMany({ where: { actorId: { in: testUserIds } } });
    await tx.refreshToken.deleteMany({ where: { userId: { in: testUserIds } } });
    await tx.otpVerification.deleteMany({
      where: {
        identifier: { in: TEST_ACCOUNT_EMAILS }
      }
    });

    // 11. Finally delete the test users
    console.log(`11. Deleting ${testUserIds.length} test user accounts...`);
    const result = await tx.user.deleteMany({
      where: { id: { in: testUserIds } }
    });
    console.log(`✅ Successfully deleted ${result.count} test users and all related data!`);
  }, {
    timeout: 30000
  });

  console.log('✨ Neon database cleanup completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Cleanup failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
