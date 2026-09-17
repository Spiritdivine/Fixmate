import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PRESERVED_EMAILS = [
  '01spiritdivine@gmail.com',
  'spiritdivine777@gmail.com',
  'admin@artisanplatform.com',
  'treasury@fixmate.ng',
];

async function cleanMockData(dryRun = false) {
  console.log(`=============================================================`);
  console.log(`🧹 ARTIFIX DATABASE MOCK DATA PURGE (DryRun: ${dryRun})`);
  console.log(`=============================================================`);

  // 1. Identify users
  const preservedUsers = await prisma.user.findMany({
    where: { email: { in: PRESERVED_EMAILS } },
    select: { id: true, email: true, role: true },
  });
  const preservedUserIds = preservedUsers.map((u) => u.id);
  console.log(`🔒 Preserved User Accounts (${preservedUsers.length}):`);
  preservedUsers.forEach((u) => console.log(`   - ${u.email} (${u.role}, ID: ${u.id})`));

  const mockUsers = await prisma.user.findMany({
    where: { id: { notIn: preservedUserIds } },
    select: { id: true, email: true, role: true },
  });
  const mockUserIds = mockUsers.map((u) => u.id);
  console.log(`\n🎯 Mock User Accounts to Delete (${mockUsers.length})`);

  // 2. Identify preserved contracts & jobs
  const preservedJobs = await prisma.job.findMany({
    where: { clientId: { in: preservedUserIds } },
    select: { id: true, title: true },
  });
  const preservedJobIds = preservedJobs.map((j) => j.id);

  const preservedContracts = await prisma.contract.findMany({
    where: {
      OR: [
        { clientId: { in: preservedUserIds } },
        { artisanId: { in: preservedUserIds } },
      ],
    },
    select: { id: true, contractCode: true },
  });
  const preservedContractIds = preservedContracts.map((c) => c.id);

  console.log(`🔒 Preserved Jobs (${preservedJobs.length}):`, preservedJobs.map((j) => j.title));
  console.log(`🔒 Preserved Contracts (${preservedContracts.length}):`, preservedContracts.map((c) => c.contractCode));

  // Entities to delete
  const mockContracts = await prisma.contract.findMany({
    where: { id: { notIn: preservedContractIds } },
    select: { id: true },
  });
  const mockContractIds = mockContracts.map((c) => c.id);

  const mockJobs = await prisma.job.findMany({
    where: { id: { notIn: preservedJobIds } },
    select: { id: true },
  });
  const mockJobIds = mockJobs.map((j) => j.id);

  const mockProposals = await prisma.proposal.findMany({
    where: {
      OR: [
        { artisanId: { in: mockUserIds } },
        { jobId: { in: mockJobIds } },
      ],
      id: {
        notIn: (
          await prisma.contract.findMany({
            where: { id: { in: preservedContractIds } },
            select: { proposalId: true },
          })
        )
          .map((c) => c.proposalId)
          .filter(Boolean),
      },
    },
    select: { id: true },
  });
  const mockProposalIds = mockProposals.map((p) => p.id);
  const mockEmails = mockUsers.map((u) => u.email).filter(Boolean);
  const mockPhones = (
    await prisma.user.findMany({ where: { id: { in: mockUserIds } }, select: { phoneNumber: true } })
  )
    .map((u) => u.phoneNumber)
    .filter(Boolean);
  const mockIdentifiers = [...mockEmails, ...mockPhones];

  // Deletion Plan Counts
  const counts = {
    disputeMessages: await prisma.disputeMessage.count({ where: { dispute: { contractId: { in: mockContractIds } } } }),
    disputeEvidence: await prisma.disputeEvidence.count({ where: { dispute: { contractId: { in: mockContractIds } } } }),
    disputes: await prisma.dispute.count({ where: { contractId: { in: mockContractIds } } }),
    reviews: await prisma.review.count({ where: { contractId: { in: mockContractIds } } }),
    messages: await prisma.message.count({ where: { senderId: { in: mockUserIds } } }),
    conversationParticipants: await prisma.conversationParticipant.count({ where: { userId: { in: mockUserIds } } }),
    milestones: await prisma.milestone.count({ where: { contractId: { in: mockContractIds } } }),
    transactions: await prisma.transaction.count({
      where: {
        OR: [
          { contractId: { in: mockContractIds } },
          { wallet: { userId: { in: mockUserIds } } },
        ],
      },
    }),
    contracts: mockContractIds.length,
    proposalMilestones: await prisma.proposalMilestone.count({ where: { proposalId: { in: mockProposalIds } } }),
    proposals: mockProposalIds.length,
    jobAttachments: await prisma.jobAttachment.count({ where: { jobId: { in: mockJobIds } } }),
    jobSkills: await prisma.jobSkill.count({ where: { jobId: { in: mockJobIds } } }),
    jobInvitations: await prisma.jobInvitation.count({
      where: {
        OR: [
          { jobId: { in: mockJobIds } },
          { artisanId: { in: mockUserIds } },
        ],
      },
    }),
    savedJobs: await prisma.savedJob.count({ where: { OR: [{ jobId: { in: mockJobIds } }, { userId: { in: mockUserIds } }] } }),
    savedArtisans: await prisma.savedArtisan.count({ where: { OR: [{ artisanProfile: { userId: { in: mockUserIds } } }, { userId: { in: mockUserIds } }] } }),
    jobs: mockJobIds.length,
    artisanPortfolios: await prisma.artisanPortfolio.count({ where: { artisanProfile: { userId: { in: mockUserIds } } } }),
    artisanServices: await prisma.artisanService.count({ where: { artisanProfile: { userId: { in: mockUserIds } } } }),
    artisanSkills: await prisma.artisanSkill.count({ where: { artisanProfile: { userId: { in: mockUserIds } } } }),
    kycSubmissions: await prisma.kycVerification.count({ where: { userId: { in: mockUserIds } } }),
    artisanProfiles: await prisma.artisanProfile.count({ where: { userId: { in: mockUserIds } } }),
    clientProfiles: await prisma.clientProfile.count({ where: { userId: { in: mockUserIds } } }),
    payoutRequests: await prisma.payoutRequest.count({ where: { userId: { in: mockUserIds } } }),
    bankAccounts: await prisma.bankAccount.count({ where: { userId: { in: mockUserIds } } }),
    savedCards: await prisma.savedPaymentMethod.count({ where: { userId: { in: mockUserIds } } }),
    wallets: await prisma.wallet.count({ where: { userId: { in: mockUserIds } } }),
    notifications: await prisma.notification.count({ where: { userId: { in: mockUserIds } } }),
    auditLogs: await prisma.auditLog.count({ where: { actorId: { in: mockUserIds } } }),
    refreshTokens: await prisma.refreshToken.count({ where: { userId: { in: mockUserIds } } }),
    otpVerifications: await prisma.otpVerification.count({ where: { identifier: { in: mockIdentifiers } } }),
    users: mockUserIds.length,
  };

  console.log('\n📊 ENTITY PURGE AUDIT:');
  console.table(counts);

  if (dryRun) {
    console.log('⚡ Dry run finished. No rows deleted.');
    return;
  }

  console.log('\n🔥 DELETING IN TOPOLOGICAL DEPENDENCY ORDER...');

  // 1. Disputes
  await prisma.disputeMessage.deleteMany({ where: { dispute: { contractId: { in: mockContractIds } } } });
  await prisma.disputeEvidence.deleteMany({ where: { dispute: { contractId: { in: mockContractIds } } } });
  await prisma.dispute.deleteMany({ where: { contractId: { in: mockContractIds } } });

  // 2. Reviews
  await prisma.review.deleteMany({ where: { contractId: { in: mockContractIds } } });

  // 3. Messages & Conversations
  await prisma.message.deleteMany({ where: { senderId: { in: mockUserIds } } });
  await prisma.conversationParticipant.deleteMany({ where: { userId: { in: mockUserIds } } });
  // Delete empty conversations
  const emptyConversations = await prisma.conversation.findMany({
    where: { participants: { none: {} } },
    select: { id: true },
  });
  if (emptyConversations.length > 0) {
    await prisma.conversation.deleteMany({
      where: { id: { in: emptyConversations.map((c) => c.id) } },
    });
  }

  // 4. Milestones & Transactions
  await prisma.milestone.deleteMany({ where: { contractId: { in: mockContractIds } } });
  await prisma.transaction.deleteMany({
    where: {
      OR: [
        { contractId: { in: mockContractIds } },
        { wallet: { userId: { in: mockUserIds } } },
      ],
    },
  });

  // 5. Contracts
  await prisma.contract.deleteMany({ where: { id: { in: mockContractIds } } });

  // 6. Proposals
  await prisma.proposalMilestone.deleteMany({ where: { proposalId: { in: mockProposalIds } } });
  await prisma.proposal.deleteMany({ where: { id: { in: mockProposalIds } } });

  // 7. Jobs & relations
  await prisma.jobAttachment.deleteMany({ where: { jobId: { in: mockJobIds } } });
  await prisma.jobSkill.deleteMany({ where: { jobId: { in: mockJobIds } } });
  await prisma.jobInvitation.deleteMany({
    where: {
      OR: [
        { jobId: { in: mockJobIds } },
        { artisanId: { in: mockUserIds } },
      ],
    },
  });
  await prisma.savedJob.deleteMany({ where: { OR: [{ jobId: { in: mockJobIds } }, { userId: { in: mockUserIds } }] } });
  await prisma.savedArtisan.deleteMany({ where: { OR: [{ artisanProfile: { userId: { in: mockUserIds } } }, { userId: { in: mockUserIds } }] } });
  await prisma.job.deleteMany({ where: { id: { in: mockJobIds } } });

  // 8. Artisan & Client Profiles
  await prisma.artisanPortfolio.deleteMany({ where: { artisanProfile: { userId: { in: mockUserIds } } } });
  await prisma.artisanService.deleteMany({ where: { artisanProfile: { userId: { in: mockUserIds } } } });
  await prisma.artisanSkill.deleteMany({ where: { artisanProfile: { userId: { in: mockUserIds } } } });
  await prisma.kycVerification.deleteMany({ where: { userId: { in: mockUserIds } } });
  await prisma.artisanProfile.deleteMany({ where: { userId: { in: mockUserIds } } });
  await prisma.clientProfile.deleteMany({ where: { userId: { in: mockUserIds } } });

  // 9. Banking & Wallets
  await prisma.payoutRequest.deleteMany({ where: { userId: { in: mockUserIds } } });
  await prisma.bankAccount.deleteMany({ where: { userId: { in: mockUserIds } } });
  await prisma.savedPaymentMethod.deleteMany({ where: { userId: { in: mockUserIds } } });
  await prisma.wallet.deleteMany({ where: { userId: { in: mockUserIds } } });

  // 10. Auth, tokens, notifications
  await prisma.notification.deleteMany({ where: { userId: { in: mockUserIds } } });
  await prisma.auditLog.deleteMany({ where: { actorId: { in: mockUserIds } } });
  await prisma.refreshToken.deleteMany({ where: { userId: { in: mockUserIds } } });
  await prisma.otpVerification.deleteMany({ where: { identifier: { in: mockIdentifiers } } });

  // 11. Mock Users
  const deletedUsers = await prisma.user.deleteMany({ where: { id: { in: mockUserIds } } });
  console.log(`✅ Successfully deleted ${deletedUsers.count} mock users and all associated data.`);

  // 12. Verification check
  const remainingUsers = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      wallet: { select: { availableBalance: true, escrowLockedBalance: true } },
      _count: {
        select: {
          jobsAsClient: true,
          contractsAsClient: true,
          contractsAsArtisan: true,
          proposals: true,
        },
      },
    },
  });

  console.log('\n✨ POST-CLEANUP ACTIVE USERS:');
  remainingUsers.forEach((u) => {
    console.log(
      `   - ${u.email} [${u.role}] | Wallet: ₦${u.wallet?.availableBalance || 0} | Jobs: ${u._count.jobsAsClient} | Contracts(Client): ${u._count.contractsAsClient} | Contracts(Artisan): ${u._count.contractsAsArtisan}`
    );
  });
  console.log('\n🎉 Clean up completed successfully!');
}

const isDryRun = process.argv.includes('--dry-run');

cleanMockData(isDryRun)
  .catch((err) => {
    console.error('❌ Error during cleanup:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
