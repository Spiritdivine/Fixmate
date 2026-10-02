import prisma from '../src/config/db.js';

const SEED_EMAILS = [
  'admin@artisanplatform.com',
  'client@fixmate.ng',
  'artisan@fixmate.ng',
  'treasury@artifixhq.xyz',
];

async function clearNonSeedUsers() {
  console.log('🧹 Starting cleanup of non-seeded database users...');

  const usersToDelete = await prisma.user.findMany({
    where: { email: { notIn: SEED_EMAILS } },
    select: { id: true, email: true, phoneNumber: true },
  });

  if (usersToDelete.length === 0) {
    console.log('✨ No non-seed users found. Database is already clean.');
    return;
  }

  const userIds = usersToDelete.map((u) => u.id);
  const identifiers = usersToDelete
    .flatMap((u) => [u.email, u.phoneNumber])
    .filter(Boolean);

  console.log(`Found ${usersToDelete.length} non-seed user(s) to remove:`);
  usersToDelete.forEach((u) => console.log(`  - ${u.email} (${u.id})`));

  // 1. Identify associated contracts
  const contracts = await prisma.contract.findMany({
    where: {
      OR: [{ clientId: { in: userIds } }, { artisanId: { in: userIds } }],
    },
    select: { id: true },
  });
  const contractIds = contracts.map((c) => c.id);

  if (contractIds.length > 0) {
    console.log(`Deleting ${contractIds.length} related contract(s)...`);
    await prisma.disputeEvidence.deleteMany({
      where: { dispute: { contractId: { in: contractIds } } },
    });
    await prisma.disputeMessage.deleteMany({
      where: { dispute: { contractId: { in: contractIds } } },
    });
    await prisma.dispute.deleteMany({ where: { contractId: { in: contractIds } } });
    await prisma.review.deleteMany({ where: { contractId: { in: contractIds } } });
    await prisma.transaction.deleteMany({ where: { contractId: { in: contractIds } } });
    await prisma.message.deleteMany({
      where: { conversation: { contractId: { in: contractIds } } },
    });
    await prisma.conversationParticipant.deleteMany({
      where: { conversation: { contractId: { in: contractIds } } },
    });
    await prisma.conversation.deleteMany({ where: { contractId: { in: contractIds } } });
    await prisma.milestone.deleteMany({ where: { contractId: { in: contractIds } } });
    await prisma.contract.deleteMany({ where: { id: { in: contractIds } } });
  }

  // 2. Identify associated proposals
  const proposals = await prisma.proposal.findMany({
    where: { artisanId: { in: userIds } },
    select: { id: true },
  });
  const proposalIds = proposals.map((p) => p.id);
  if (proposalIds.length > 0) {
    console.log(`Deleting ${proposalIds.length} related proposal(s)...`);
    await prisma.proposalMilestone.deleteMany({
      where: { proposalId: { in: proposalIds } },
    });
    await prisma.proposal.deleteMany({ where: { id: { in: proposalIds } } });
  }

  // 3. Identify associated jobs
  const jobs = await prisma.job.findMany({
    where: { clientId: { in: userIds } },
    select: { id: true },
  });
  const jobIds = jobs.map((j) => j.id);
  if (jobIds.length > 0) {
    console.log(`Deleting ${jobIds.length} related job(s)...`);
    await prisma.jobSkill.deleteMany({ where: { jobId: { in: jobIds } } });
    await prisma.proposalMilestone.deleteMany({
      where: { proposal: { jobId: { in: jobIds } } },
    });
    await prisma.proposal.deleteMany({ where: { jobId: { in: jobIds } } });
    await prisma.jobInvitation.deleteMany({ where: { jobId: { in: jobIds } } });
    await prisma.savedJob.deleteMany({ where: { jobId: { in: jobIds } } });
    await prisma.job.deleteMany({ where: { id: { in: jobIds } } });
  }

  // 4. Financial & Wallet relations
  const wallets = await prisma.wallet.findMany({
    where: { userId: { in: userIds } },
    select: { id: true },
  });
  const walletIds = wallets.map((w) => w.id);
  if (walletIds.length > 0) {
    await prisma.transaction.deleteMany({ where: { walletId: { in: walletIds } } });
    await prisma.payoutRequest.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.bankAccount.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.savedPaymentMethod.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.wallet.deleteMany({ where: { id: { in: walletIds } } });
  }

  // 5. Auth, OTP & Session relations
  await prisma.refreshToken.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.otpVerification.deleteMany({
    where: { identifier: { in: identifiers } },
  });
  await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.pushSubscription.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.savedArtisan.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.kycVerification.deleteMany({ where: { userId: { in: userIds } } });

  // 6. Profiles
  const artisanProfiles = await prisma.artisanProfile.findMany({
    where: { userId: { in: userIds } },
    select: { id: true },
  });
  const artisanProfileIds = artisanProfiles.map((ap) => ap.id);
  if (artisanProfileIds.length > 0) {
    await prisma.artisanPortfolio.deleteMany({
      where: { artisanProfileId: { in: artisanProfileIds } },
    });
    await prisma.artisanSkill.deleteMany({
      where: { artisanProfileId: { in: artisanProfileIds } },
    });
    await prisma.artisanService.deleteMany({
      where: { artisanProfileId: { in: artisanProfileIds } },
    });
    await prisma.savedArtisan.deleteMany({
      where: { artisanProfileId: { in: artisanProfileIds } },
    });
    await prisma.artisanProfile.deleteMany({ where: { id: { in: artisanProfileIds } } });
  }

  await prisma.clientProfile.deleteMany({ where: { userId: { in: userIds } } });

  // 7. Delete Users
  const deletedUsers = await prisma.user.deleteMany({
    where: { id: { in: userIds } },
  });

  console.log(`✅ Successfully deleted ${deletedUsers.count} user(s) and all cascading data.`);

  const remainingUsers = await prisma.user.findMany({
    select: { email: true, role: true, walletAddress: true },
  });
  console.log('\nRemaining seeded users in database:');
  remainingUsers.forEach((u) => console.log(`  - [${u.role}] ${u.email} (${u.walletAddress || 'No Wallet'})`));
}

clearNonSeedUsers()
  .catch((err) => {
    console.error('❌ Error during cleanup:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
