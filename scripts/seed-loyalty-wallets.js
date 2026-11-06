import prisma from '../src/config/db.js';
import { generateReferralCode } from '../src/utils/code-generator.js';

async function seedLoyaltyWallets() {
  console.log('🌱 Starting Loyalty & Referral backfill script...');

  const users = await prisma.user.findMany({
    include: { pointWallet: true },
  });

  console.log(`Found ${users.length} total users in database.`);
  let updatedCount = 0;

  for (const user of users) {
    let code = user.referralCode;
    let needsCodeUpdate = false;

    if (!code) {
      code = generateReferralCode('FIX');
      needsCodeUpdate = true;
    }

    if (needsCodeUpdate) {
      await prisma.user.update({
        where: { id: user.id },
        data: { referralCode: code },
      });
    }

    if (!user.pointWallet) {
      await prisma.pointWallet.create({
        data: {
          userId: user.id,
          availablePoints: 100, // Give existing active users a welcome courtesy balance of 100 points
          lockedPoints: 0,
          lifetimeEarned: 100,
          lifetimeBurned: 0,
          tier: 'BRONZE',
        },
      });

      // Also record the ledger entry for the welcome grant
      await prisma.pointLedgerEntry.create({
        data: {
          walletId: (await prisma.pointWallet.findUnique({ where: { userId: user.id } })).id,
          amount: 100,
          balanceBefore: 0,
          balanceAfter: 100,
          transactionType: 'ADMIN_ADJUSTMENT_CREDIT',
          idempotencyKey: `welcome-backfill:${user.id}`,
          description: 'Welcome to Artisan Rewards! Early adopter bonus.',
        },
      });

      updatedCount++;
    }
  }

  console.log(`✅ Backfill completed successfully! Provisioned ${updatedCount} users with wallets and referral codes.`);
  process.exit(0);
}

seedLoyaltyWallets().catch((err) => {
  console.error('❌ Backfill failed:', err);
  process.exit(1);
});
