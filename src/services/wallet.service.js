import prisma from '../config/db.js';
import { ApiError } from '../utils/api-error.js';
import crypto from 'crypto';

export class WalletService {
  static async getWallet(userId) {
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!wallet) throw ApiError.notFound('Wallet not found');

    return wallet;
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
    return prisma.bankAccount.create({
      data: {
        userId,
        bankName: data.bankName,
        bankCode: data.bankCode,
        accountNumber: data.accountNumber,
        accountName: data.accountName,
        isVerified: true,
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

  static async requestPayout(userId, { bankAccountId, amount }) {
    if (amount <= 0) throw ApiError.badRequest('Amount must be positive');

    const bankAccount = await prisma.bankAccount.findUnique({ where: { id: bankAccountId } });
    if (!bankAccount || bankAccount.userId !== userId) {
      throw ApiError.notFound('Bank account not found or unauthorized');
    }

    return prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) throw ApiError.notFound('Wallet not found');

      if (Number(wallet.availableBalance) < Number(amount)) {
        throw ApiError.badRequest('Insufficient available balance for withdrawal');
      }

      const balanceBefore = Number(wallet.availableBalance);
      const balanceAfter = balanceBefore - Number(amount);

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { availableBalance: { decrement: Number(amount) } },
      });

      const ref = `WTH-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

      const payout = await tx.payoutRequest.create({
        data: {
          userId,
          walletId: wallet.id,
          bankAccountId,
          amount,
          reference: ref,
          status: 'PENDING',
        },
      });

      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          reference: ref,
          type: 'PAYOUT_WITHDRAWAL',
          amount,
          netAmount: -amount,
          status: 'PENDING',
          balanceBefore,
          balanceAfter,
          description: `Withdrawal Request to ${bankAccount.bankName} - ${bankAccount.accountNumber}`,
        },
      });

      return payout;
    });
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
