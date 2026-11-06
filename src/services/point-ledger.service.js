import prisma from '../config/db.js';
import { redis } from '../config/redis.js';
import { ApiError } from '../utils/api-error.js';

export class PointLedgerService {
  /**
   * Calculates loyalty tier based on 365-day rolling qualifying tier points.
   */
  static calculateTier(tierPoints) {
    if (tierPoints >= 10000) return 'ELITE_GUILD';
    if (tierPoints >= 5000) return 'DIAMOND';
    if (tierPoints >= 2500) return 'GOLD';
    if (tierPoints >= 1000) return 'SILVER';
    return 'BRONZE';
  }

  /**
   * Retrieves tier metadata (fee discounts, search boosts, multipliers).
   */
  static getTierBenefits(tier) {
    const benefits = {
      BRONZE: {
        name: 'Bronze',
        multiplier: 1.0,
        escrowFeeDiscountPercent: 0,
        searchBoostPercent: 0,
        badgeUrl: null,
      },
      SILVER: {
        name: 'Silver',
        multiplier: 1.1,
        escrowFeeDiscountPercent: 10,
        searchBoostPercent: 5,
        badgeUrl: '/badges/silver.svg',
      },
      GOLD: {
        name: 'Gold',
        multiplier: 1.2,
        escrowFeeDiscountPercent: 20,
        searchBoostPercent: 15,
        badgeUrl: '/badges/gold.svg',
      },
      DIAMOND: {
        name: 'Diamond',
        multiplier: 1.3,
        escrowFeeDiscountPercent: 35,
        searchBoostPercent: 30,
        badgeUrl: '/badges/diamond.svg',
      },
      ELITE_GUILD: {
        name: 'Elite Guild',
        multiplier: 1.5,
        escrowFeeDiscountPercent: 50,
        searchBoostPercent: 50,
        badgeUrl: '/badges/elite.svg',
      },
    };
    return benefits[tier] || benefits.BRONZE;
  }

  /**
   * Executes a strict atomic ledger transaction with double-entry guarantees.
   * Serializes all modifications to a specific wallet using pessimistic locking.
   */
  static async recordTransaction({
    userId,
    amount, // Positive for credit, Negative for debit
    transactionType,
    idempotencyKey,
    referenceType = null,
    referenceId = null,
    description,
    metadata = {},
    expiresAt = null,
  }) {
    if (!amount || amount === 0) {
      throw ApiError.badRequest('Transaction amount cannot be zero.');
    }

    // 1. Enforce distributed idempotency check via Redis
    const redisKey = `idempotency:points:${idempotencyKey}`;
    if (redis) {
      try {
        const cached = await redis.get(redisKey);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (redisErr) {
        console.warn('[PointLedger] Redis cache read failed, continuing to DB:', redisErr.message);
      }
    }

    // 2. Execute within an ACID transaction with Pessimistic Row Lock
    return await prisma.$transaction(async (tx) => {
      // DB-level deduplication check
      const existingEntry = await tx.pointLedgerEntry.findUnique({
        where: { idempotencyKey },
      });
      if (existingEntry) {
        return {
          success: true,
          ledgerId: existingEntry.id,
          balanceAfter: existingEntry.balanceAfter,
          isDuplicate: true,
        };
      }

      // Explicitly lock the user's PointWallet row to prevent concurrent race conditions
      const lockedWallets = await tx.$queryRaw`
        SELECT * FROM "point_wallets"
        WHERE "user_id" = ${userId}::uuid
        FOR UPDATE
      `;

      let wallet = lockedWallets[0];

      // Auto-provision wallet if it doesn't exist yet
      if (!wallet) {
        wallet = await tx.pointWallet.create({
          data: {
            userId,
            availablePoints: 0,
            lockedPoints: 0,
            lifetimeEarned: 0,
            lifetimeBurned: 0,
          },
        });
      }

      const currentAvailable = wallet.available_points ?? wallet.availablePoints;
      const currentLifetimeEarned = wallet.lifetime_earned ?? wallet.lifetimeEarned;
      const currentLifetimeBurned = wallet.lifetime_burned ?? wallet.lifetimeBurned;
      const currentTierPoints = wallet.tier_points ?? wallet.tierPoints;
      const nextBalance = currentAvailable + amount;

      // Guard against negative balances on debits
      if (amount < 0 && nextBalance < 0) {
        throw ApiError.badRequest(
          `Insufficient points balance. Available: ${currentAvailable}, Requested: ${Math.abs(amount)}`
        );
      }

      const nextLifetimeEarned = amount > 0 ? currentLifetimeEarned + amount : currentLifetimeEarned;
      const nextLifetimeBurned = amount < 0 ? currentLifetimeBurned + Math.abs(amount) : currentLifetimeBurned;
      const nextTierPoints = currentTierPoints + (amount > 0 ? amount : 0);
      const newTier = this.calculateTier(nextTierPoints);

      // Mutate wallet
      const updatedWallet = await tx.pointWallet.update({
        where: { id: wallet.id },
        data: {
          availablePoints: nextBalance,
          lifetimeEarned: nextLifetimeEarned,
          lifetimeBurned: nextLifetimeBurned,
          tierPoints: nextTierPoints,
          tier: newTier,
          version: { increment: 1 },
        },
      });

      // Write immutable append-only ledger entry
      const ledgerEntry = await tx.pointLedgerEntry.create({
        data: {
          walletId: wallet.id,
          amount,
          balanceBefore: currentAvailable,
          balanceAfter: nextBalance,
          transactionType,
          idempotencyKey,
          referenceType,
          referenceId,
          description,
          metadata,
          expiresAt,
        },
      });

      const result = {
        success: true,
        ledgerId: ledgerEntry.id,
        newBalance: updatedWallet.availablePoints,
        tier: updatedWallet.tier,
      };

      if (redis) {
        try {
          await redis.set(redisKey, JSON.stringify(result), 'EX', 86400);
        } catch (redisErr) {
          console.warn('[PointLedger] Redis cache write failed:', redisErr.message);
        }
      }

      return result;
    });
  }

  /**
   * Retrieves or lazily provisions the user's point wallet and tier info.
   */
  static async getOrCreateWallet(userId) {
    let wallet = await prisma.pointWallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      wallet = await prisma.pointWallet.create({
        data: {
          userId,
          availablePoints: 0,
          lockedPoints: 0,
          lifetimeEarned: 0,
          lifetimeBurned: 0,
          tier: 'BRONZE',
        },
      });
    }

    const benefits = this.getTierBenefits(wallet.tier);
    const tierThresholds = {
      BRONZE: 1000,
      SILVER: 2500,
      GOLD: 5000,
      DIAMOND: 10000,
      ELITE_GUILD: 10000,
    };
    const nextTierThreshold = tierThresholds[wallet.tier] || 1000;
    const pointsToNextTier = Math.max(0, nextTierThreshold - wallet.tierPoints);

    return {
      wallet,
      benefits,
      nextTierThreshold,
      pointsToNextTier,
    };
  }

  /**
   * Two-phase checkout reservation: Locks points for 15 minutes during checkout.
   */
  static async reservePoints({ userId, amount, orderReference, ttlMinutes = 15 }) {
    if (amount <= 0) {
      throw ApiError.badRequest('Reserved amount must be greater than zero.');
    }

    return await prisma.$transaction(async (tx) => {
      const [wallet] = await tx.$queryRaw`
        SELECT * FROM "point_wallets"
        WHERE "user_id" = ${userId}::uuid
        FOR UPDATE
      `;

      if (!wallet) {
        throw ApiError.notFound('Point wallet not found.');
      }

      const available = wallet.available_points ?? wallet.availablePoints;
      if (available < amount) {
        throw ApiError.badRequest(`Insufficient points to reserve. Available: ${available}, Requested: ${amount}`);
      }

      // Check existing reservation
      const existing = await tx.pointReservation.findUnique({
        where: { orderReference },
      });
      if (existing && existing.status === 'PENDING_CHECKOUT') {
        return existing;
      }

      const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

      // Decrement available, increment locked
      await tx.pointWallet.update({
        where: { id: wallet.id },
        data: {
          availablePoints: { decrement: amount },
          lockedPoints: { increment: amount },
        },
      });

      const reservation = await tx.pointReservation.create({
        data: {
          walletId: wallet.id,
          amount,
          orderReference,
          status: 'PENDING_CHECKOUT',
          expiresAt,
        },
      });

      return reservation;
    });
  }

  /**
   * Commits a reserved batch of points upon successful payment verification.
   */
  static async commitReservation(orderReference) {
    return await prisma.$transaction(async (tx) => {
      const reservation = await tx.pointReservation.findUnique({
        where: { orderReference },
        include: { wallet: true },
      });

      if (!reservation || reservation.status !== 'PENDING_CHECKOUT') {
        return null;
      }

      // Unlock from lockedPoints and record debit ledger entry
      await tx.pointWallet.update({
        where: { id: reservation.walletId },
        data: {
          lockedPoints: { decrement: reservation.amount },
          lifetimeBurned: { increment: reservation.amount },
        },
      });

      await tx.pointReservation.update({
        where: { id: reservation.id },
        data: { status: 'COMMITTED' },
      });

      await tx.pointLedgerEntry.create({
        data: {
          walletId: reservation.walletId,
          amount: -reservation.amount,
          balanceBefore: reservation.wallet.availablePoints + reservation.amount,
          balanceAfter: reservation.wallet.availablePoints,
          transactionType: 'ESCROW_FEE_DISCOUNT_BURN',
          idempotencyKey: `commit-reservation:${reservation.id}`,
          referenceType: 'RESERVATION',
          referenceId: reservation.id,
          description: `Redeemed ${reservation.amount} points on Order ${orderReference}`,
        },
      });

      return true;
    });
  }

  /**
   * Releases expired or cancelled reservations back to available balance.
   */
  static async releaseReservation(orderReference) {
    return await prisma.$transaction(async (tx) => {
      const reservation = await tx.pointReservation.findUnique({
        where: { orderReference },
      });

      if (!reservation || reservation.status !== 'PENDING_CHECKOUT') {
        return false;
      }

      await tx.pointWallet.update({
        where: { id: reservation.walletId },
        data: {
          availablePoints: { increment: reservation.amount },
          lockedPoints: { decrement: reservation.amount },
        },
      });

      await tx.pointReservation.update({
        where: { id: reservation.id },
        data: { status: 'RELEASED' },
      });

      return true;
    });
  }

  /**
   * Fetches paginated history for user ledger.
   */
  static async getLedgerHistory(userId, { page = 1, limit = 20 } = {}) {
    const wallet = await prisma.pointWallet.findUnique({
      where: { userId },
    });

    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const skip = (parsedPage - 1) * parsedLimit;

    if (!wallet) {
      return { items: [], pagination: { total: 0, page: parsedPage, limit: parsedLimit, totalPages: 0 } };
    }

    const [items, total] = await Promise.all([
      prisma.pointLedgerEntry.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parsedLimit,
      }),
      prisma.pointLedgerEntry.count({
        where: { walletId: wallet.id },
      }),
    ]);

    return {
      items,
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.ceil(total / parsedLimit),
      },
    };
  }
}
