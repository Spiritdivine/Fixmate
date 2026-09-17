import prisma from '../config/db.js';
import crypto from 'crypto';

export const SYSTEM_TREASURY_EMAIL = 'treasury@fixmate.ng';

export class TreasuryService {
  static cachedTreasuryWallet = null;

  /**
   * Ensures the system treasury user and wallet exist in PostgreSQL
   */
  static async ensureTreasuryWallet(tx = prisma) {
    if (this.cachedTreasuryWallet) {
      return this.cachedTreasuryWallet;
    }

    let treasuryUser = await tx.user.findUnique({
      where: { email: SYSTEM_TREASURY_EMAIL },
      include: { wallet: true },
    });

    if (!treasuryUser) {
      treasuryUser = await tx.user.create({
        data: {
          email: SYSTEM_TREASURY_EMAIL,
          phoneNumber: '+2340000000000',
          passwordHash: crypto.randomBytes(32).toString('hex'),
          role: 'ADMIN',
          status: 'ACTIVE',
          isEmailVerified: true,
          isPhoneVerified: true,
          isKycVerified: true,
          wallet: {
            create: {
              availableBalance: 0.00,
              escrowLockedBalance: 0.00,
              currency: 'NGN',
            },
          },
        },
        include: { wallet: true },
      });
    } else if (!treasuryUser.wallet) {
      const wallet = await tx.wallet.create({
        data: {
          userId: treasuryUser.id,
          availableBalance: 0.00,
          escrowLockedBalance: 0.00,
          currency: 'NGN',
        },
      });
      treasuryUser.wallet = wallet;
    }

    this.cachedTreasuryWallet = treasuryUser.wallet;
    return treasuryUser.wallet;
  }

  /**
   * Records platform fee earnings directly into the Treasury Wallet
   */
  static async recordFee(tx, { amount, contractId = null, milestoneId = null, reference = null, description = null, metadata = {} }) {
    const feeNum = Number(amount);
    if (!feeNum || feeNum <= 0) return null;

    const treasuryWallet = await this.ensureTreasuryWallet(tx);

    const lockedWallets = await tx.$queryRaw`
      SELECT id, available_balance FROM wallets WHERE id = ${treasuryWallet.id}::uuid FOR UPDATE
    `;
    const lockedWallet = lockedWallets && lockedWallets[0];
    const balanceBefore = lockedWallet ? Number(lockedWallet.available_balance) : Number(treasuryWallet.availableBalance);
    const balanceAfter = balanceBefore + feeNum;

    await tx.wallet.update({
      where: { id: treasuryWallet.id },
      data: {
        availableBalance: { increment: feeNum },
      },
    });

    const feeRef = reference || `FEE-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

    const transaction = await tx.transaction.create({
      data: {
        walletId: treasuryWallet.id,
        contractId,
        milestoneId,
        reference: feeRef,
        type: 'PLATFORM_FEE',
        amount: feeNum,
        netAmount: feeNum,
        status: 'SUCCESS',
        balanceBefore,
        balanceAfter,
        description: description || `Fixmate Platform Fee (Contract #${contractId || 'N/A'})`,
        metadata: {
          ...metadata,
          source: 'PLATFORM_FEE',
          collectedAt: new Date().toISOString(),
        },
      },
    });

    return {
      treasuryWalletId: treasuryWallet.id,
      amount: feeNum,
      balanceAfter,
      transaction,
    };
  }

  /**
   * Retrieves overall platform financial revenue metrics
   */
  static async getTreasuryMetrics() {
    const treasuryWallet = await this.ensureTreasuryWallet(prisma);

    const [currentWallet, totalFeesAgg, recentFeeTransactions] = await Promise.all([
      prisma.wallet.findUnique({
        where: { id: treasuryWallet.id },
      }),
      prisma.transaction.aggregate({
        where: {
          walletId: treasuryWallet.id,
          type: 'PLATFORM_FEE',
          status: 'SUCCESS',
        },
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.transaction.findMany({
        where: {
          walletId: treasuryWallet.id,
          type: 'PLATFORM_FEE',
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ]);

    return {
      availableBalance: Number(currentWallet?.availableBalance || 0),
      totalFeesCollected: Number(totalFeesAgg._sum.amount || 0),
      totalFeeEvents: totalFeesAgg._count.id,
      currency: 'NGN',
      recentFeeTransactions,
    };
  }
}

export default TreasuryService;
