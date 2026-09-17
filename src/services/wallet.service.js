import prisma from '../config/db.js';
import { ApiError } from '../utils/api-error.js';
import { PaystackService } from './paystack.service.js';
import crypto from 'crypto';

export class WalletService {
  static async getWallet(userId) {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [wallet, past24hPayouts, user] = await Promise.all([
      prisma.wallet.findUnique({
        where: { userId },
        include: {
          transactions: {
            orderBy: { createdAt: 'desc' },
            take: 50,
          },
          payoutRequests: {
            include: { bankAccount: true },
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
        },
      }),
      prisma.payoutRequest.findMany({
        where: {
          userId,
          status: { in: ['PENDING', 'PROCESSING', 'COMPLETED'] },
          createdAt: { gte: twentyFourHoursAgo },
        },
        select: { amount: true, sourceCurrency: true },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { isKycVerified: true },
      }),
    ]);

    if (!wallet) throw ApiError.notFound('Wallet not found');

    const totalWithdrawn24hNgn = past24hPayouts
      .filter((p) => (p.sourceCurrency || 'NGN') === 'NGN')
      .reduce((acc, p) => acc + Number(p.amount), 0);

    const isKycVerified = Boolean(user?.isKycVerified);
    const dailyLimitNgn = isKycVerified ? 1_000_000 : 50_000;
    const dailyLimitUsdc = isKycVerified ? 1000 : 50;

    return {
      ...wallet,
      tierLimits: {
        isKycVerified,
        dailyLimitNgn,
        totalWithdrawn24hNgn,
        remainingLimitNgn: Math.max(0, dailyLimitNgn - totalWithdrawn24hNgn),
        dailyLimitUsdc,
      },
    };
  }

  static async getPayoutRequests(userId) {
    return prisma.payoutRequest.findMany({
      where: { userId },
      include: {
        bankAccount: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  /**
   * Internal Simulation / Dev Top-up
   */
  static async simulateDeposit(userId, amount) {
    if (amount <= 0) throw ApiError.badRequest('Deposit amount must be greater than 0');

    return prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) throw ApiError.notFound('Wallet not found');

      const balanceBefore = Number(wallet.availableBalance);
      const balanceAfter = balanceBefore + Number(amount);

      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { availableBalance: { increment: Number(amount) } },
      });

      const ref = `SIM-DEP-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          reference: ref,
          type: 'WALLET_DEPOSIT',
          amount,
          netAmount: amount,
          status: 'SUCCESS',
          balanceBefore,
          balanceAfter,
          description: `Simulated Wallet Top-up (Development Test Fund: ₦${amount.toLocaleString()})`,
        },
      });

      return {
        wallet: updatedWallet,
        reference: ref,
      };
    });
  }

  static async addBankAccount(userId, data) {
    // 1. Resolve Account Name with Paystack
    const resolved = await PaystackService.resolveBankAccount(data.accountNumber, data.bankCode);
    const verifiedAccountName = resolved.accountName || data.accountName;

    // 2. Create Paystack Transfer Recipient
    const recipientCode = await PaystackService.createTransferRecipient({
      name: verifiedAccountName,
      accountNumber: data.accountNumber,
      bankCode: data.bankCode,
    });

    // 3. Determine if first bank account (make default if so)
    const existingCount = await prisma.bankAccount.count({ where: { userId } });

    return prisma.bankAccount.create({
      data: {
        userId,
        bankName: data.bankName,
        bankCode: data.bankCode,
        accountNumber: data.accountNumber,
        accountName: verifiedAccountName,
        recipientCode,
        isVerified: true,
        isDefault: existingCount === 0,
      },
    });
  }

  static async getBankAccounts(userId) {
    return prisma.bankAccount.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async deleteBankAccount(userId, bankAccountId) {
    const bank = await prisma.bankAccount.findUnique({ where: { id: bankAccountId } });
    if (!bank || bank.userId !== userId) {
      throw ApiError.notFound('Bank account not found or unauthorized');
    }

    return prisma.bankAccount.delete({
      where: { id: bankAccountId },
    });
  }

  static async setDefaultBankAccount(userId, bankAccountId) {
    const bank = await prisma.bankAccount.findUnique({ where: { id: bankAccountId } });
    if (!bank || bank.userId !== userId) {
      throw ApiError.notFound('Bank account not found or unauthorized');
    }

    return prisma.$transaction(async (tx) => {
      await tx.bankAccount.updateMany({
        where: { userId },
        data: { isDefault: false },
      });

      return tx.bankAccount.update({
        where: { id: bankAccountId },
        data: { isDefault: true },
      });
    });
  }

  static async requestPayout(userId, param1, param2 = null) {
    let amount;
    let bankAccountId;

    if (typeof param1 === 'object' && param1 !== null) {
      amount = param1.amount;
      bankAccountId = param1.bankAccountId;
    } else {
      amount = param1;
      bankAccountId = param2;
    }

    if (!bankAccountId) throw ApiError.badRequest('Bank account ID is required');
    if (!amount || Number(amount) <= 0) throw ApiError.badRequest('Amount must be positive');
    const requestedAmountNum = Number(amount);

    // Minimum withdrawal threshold
    if (requestedAmountNum < 1000) {
      throw ApiError.badRequest('Minimum withdrawal amount is ₦1,000.00');
    }

    const [user, bankAccount] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, isKycVerified: true },
      }),
      prisma.bankAccount.findUnique({ where: { id: bankAccountId } }),
    ]);

    if (!user) throw ApiError.notFound('User not found');
    if (!bankAccount || bankAccount.userId !== userId) {
      throw ApiError.notFound('Bank account not found or unauthorized');
    }

    // Ensure recipient code exists for Paystack disbursements
    let recipientCode = bankAccount.recipientCode;
    if (!recipientCode) {
      recipientCode = await PaystackService.createTransferRecipient({
        name: bankAccount.accountName,
        accountNumber: bankAccount.accountNumber,
        bankCode: bankAccount.bankCode,
      });
      await prisma.bankAccount.update({
        where: { id: bankAccount.id },
        data: { recipientCode },
      });
    }

    // 1. Tiered KYC Daily Withdrawal Limits (Rolling 24 Hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const past24hPayouts = await prisma.payoutRequest.findMany({
      where: {
        userId,
        status: { in: ['PENDING', 'PROCESSING', 'COMPLETED'] },
        createdAt: { gte: twentyFourHoursAgo },
      },
      select: { amount: true },
    });

    const totalWithdrawn24h = past24hPayouts.reduce((acc, p) => acc + Number(p.amount), 0);
    const maxDailyLimit = user.isKycVerified ? 1_000_000 : 50_000;

    if (totalWithdrawn24h + requestedAmountNum > maxDailyLimit) {
      if (!user.isKycVerified) {
        throw ApiError.badRequest(
          `Daily withdrawal limit of ₦50,000 exceeded (24h total: ₦${totalWithdrawn24h.toLocaleString()}). Please complete KYC verification in your profile to unlock ₦1,000,000 daily limits.`
        );
      } else {
        throw ApiError.badRequest(
          `Daily withdrawal limit of ₦1,000,000 exceeded (24h total: ₦${totalWithdrawn24h.toLocaleString()}). Please contact corporate support for Tier-3 enterprise limits.`
        );
      }
    }

    // 2. Atomic Transaction with Pessimistic Row-Level Lock (FOR UPDATE)
    const ref = `WTH-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const payout = await prisma.$transaction(async (tx) => {
      const lockedWallets = await tx.$queryRaw`
        SELECT id, available_balance FROM wallets WHERE user_id = ${userId}::uuid FOR UPDATE
      `;
      const wallet = lockedWallets && lockedWallets[0];
      if (!wallet) throw ApiError.notFound('Wallet not found');

      const currentAvailable = Number(wallet.available_balance);
      if (currentAvailable < requestedAmountNum) {
        throw ApiError.badRequest(`Insufficient available balance. Required: ₦${requestedAmountNum.toLocaleString()}, Available: ₦${currentAvailable.toLocaleString()}`);
      }

      const balanceBefore = currentAvailable;
      const balanceAfter = balanceBefore - requestedAmountNum;

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { availableBalance: { decrement: requestedAmountNum } },
      });

      const newPayout = await tx.payoutRequest.create({
        data: {
          userId,
          walletId: wallet.id,
          bankAccountId,
          amount: requestedAmountNum,
          reference: ref,
          status: 'PENDING',
          gateway: 'PAYSTACK',
        },
      });

      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          reference: ref,
          type: 'PAYOUT_WITHDRAWAL',
          amount: requestedAmountNum,
          netAmount: -requestedAmountNum,
          status: 'PENDING',
          balanceBefore,
          balanceAfter,
          description: `Withdrawal Request to ${bankAccount.bankName} - ${bankAccount.accountNumber}`,
          metadata: {
            tier: user.isKycVerified ? 'TIER_2_VERIFIED' : 'TIER_1_UNVERIFIED',
            dailyWithdrawn24h: totalWithdrawn24h,
          },
        },
      });

      return newPayout;
    });

    // 3. Autonomous Execution for amounts <= ₦100,000 (Tiered Auto-Payout Policy)
    if (requestedAmountNum <= 100000 && recipientCode) {
      const amountKobo = Math.round(requestedAmountNum * 100);
      const transferResult = await PaystackService.initiateTransfer({
        amountKobo,
        recipientCode,
        reference: ref,
        reason: `Fixmate Payout to ${bankAccount.accountName}`,
      });

      if (transferResult.status === 'success' || transferResult.status === 'pending' || transferResult.status === 'otp') {
        const updated = await prisma.payoutRequest.update({
          where: { id: payout.id },
          data: {
            status: 'PROCESSING',
            gatewayTransferCode: transferResult.transferCode,
          },
        });
        return updated;
      } else if (transferResult.status === 'failed') {
        // Immediate reversal if Paystack rejected synchronously
        await prisma.$transaction(async (tx) => {
          await tx.payoutRequest.update({
            where: { id: payout.id },
            data: {
              status: 'REJECTED',
              failureReason: transferResult.failureReason || 'Paystack transfer rejected',
            },
          });
          await tx.transaction.updateMany({
            where: { reference: ref },
            data: { status: 'FAILED' },
          });
          await tx.wallet.update({
            where: { id: payout.walletId },
            data: { availableBalance: { increment: requestedAmountNum } },
          });
        });
        throw ApiError.badRequest(`Transfer failed: ${transferResult.failureReason || 'Banking network error'}`);
      }
    }

    return payout;
  }

  static async cancelPayoutRequest(userId, payoutId) {
    const payout = await prisma.payoutRequest.findUnique({ where: { id: payoutId } });
    if (!payout || payout.userId !== userId) {
      throw ApiError.notFound('Payout request not found or unauthorized');
    }

    if (payout.status !== 'PENDING') {
      throw ApiError.badRequest('Only pending payout requests can be cancelled');
    }

    return prisma.$transaction(async (tx) => {
      const updatedPayout = await tx.payoutRequest.update({
        where: { id: payoutId },
        data: { status: 'REJECTED', failureReason: 'Cancelled by user' },
      });

      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (wallet) {
        const balanceBefore = Number(wallet.availableBalance);
        const balanceAfter = balanceBefore + Number(payout.amount);

        await tx.wallet.update({
          where: { id: wallet.id },
          data: { availableBalance: { increment: Number(payout.amount) } },
        });

        const ref = `WTH-REV-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
        await tx.transaction.create({
          data: {
            walletId: wallet.id,
            reference: ref,
            type: 'WALLET_DEPOSIT',
            amount: payout.amount,
            netAmount: payout.amount,
            status: 'SUCCESS',
            balanceBefore,
            balanceAfter,
            description: `Reversal of Cancelled Withdrawal #${payout.reference}`,
          },
        });
      }

      return updatedPayout;
    });
  }

  /**
   * Saved Payment Methods (Cards)
   */
  static async getSavedPaymentMethods(userId) {
    return prisma.savedPaymentMethod.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async setDefaultPaymentMethod(userId, cardId) {
    const card = await prisma.savedPaymentMethod.findUnique({ where: { id: cardId } });
    if (!card || card.userId !== userId) {
      throw ApiError.notFound('Payment method not found or unauthorized');
    }

    return prisma.$transaction(async (tx) => {
      await tx.savedPaymentMethod.updateMany({
        where: { userId },
        data: { isDefault: false },
      });

      return tx.savedPaymentMethod.update({
        where: { id: cardId },
        data: { isDefault: true },
      });
    });
  }

  static async deletePaymentMethod(userId, cardId) {
    const card = await prisma.savedPaymentMethod.findUnique({ where: { id: cardId } });
    if (!card || card.userId !== userId) {
      throw ApiError.notFound('Payment method not found or unauthorized');
    }

    return prisma.savedPaymentMethod.delete({
      where: { id: cardId },
    });
  }
}

export default WalletService;
