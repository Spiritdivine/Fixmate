import { PointLedgerService } from '../services/point-ledger.service.js';
import { ReferralService } from '../services/referral.service.js';
import { ApiResponse } from '../utils/api-response.js';
import { ApiError } from '../utils/api-error.js';
import prisma from '../config/db.js';

export class LoyaltyController {
  /**
   * Retrieves current user's point wallet, tier status, benefits, and referral metadata.
   */
  static async getProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const [walletData, referralData] = await Promise.all([
        PointLedgerService.getOrCreateWallet(userId),
        ReferralService.getReferralStats(userId),
      ]);

      const { wallet, benefits, nextTierThreshold, pointsToNextTier } = walletData;

      const responsePayload = {
        points: {
          available: wallet.availablePoints,
          locked: wallet.lockedPoints,
          lifetimeEarned: wallet.lifetimeEarned,
          lifetimeBurned: wallet.lifetimeBurned,
        },
        tier: {
          current: wallet.tier,
          tierPoints: wallet.tierPoints,
          nextTierThreshold,
          pointsToNextTier,
          multiplier: benefits.multiplier,
          feeDiscountPercent: benefits.escrowFeeDiscountPercent,
          searchBoostPercent: benefits.searchBoostPercent,
          badgeUrl: benefits.badgeUrl,
        },
        referral: {
          code: referralData.code,
          shareUrl: referralData.shareUrl,
          totalInvited: referralData.totalInvited,
          totalQualified: referralData.totalQualified,
          pendingBonusPoints: referralData.pendingBonusPoints,
        },
      };

      res.status(200).json(new ApiResponse(200, responsePayload, 'Loyalty profile fetched'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves paginated point ledger history.
   */
  static async getLedger(req, res, next) {
    try {
      const userId = req.user.id;
      const { page, limit } = req.query;
      const result = await PointLedgerService.getLedgerHistory(userId, { page, limit });
      res.status(200).json(new ApiResponse(200, result, 'Ledger history retrieved'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Public pre-validation for referral codes.
   */
  static async validateCode(req, res, next) {
    try {
      const { referralCode } = req.body;
      const result = await ReferralService.validateCode(referralCode);
      res.status(200).json(new ApiResponse(200, result, 'Referral code validated'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reserves points to discount platform escrow fee at checkout.
   */
  static async reserveDiscount(req, res, next) {
    try {
      const userId = req.user.id;
      const { amount, orderReference, ttlMinutes } = req.body;

      const reservation = await PointLedgerService.reservePoints({
        userId,
        amount,
        orderReference,
        ttlMinutes,
      });

      res.status(200).json(new ApiResponse(200, reservation, 'Points reserved for checkout'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Artisan burns points to activate directory spotlight for 7 or more days.
   */
  static async purchaseDirectoryBoost(req, res, next) {
    try {
      const userId = req.user.id;
      const days = req.body.days || 7;
      const pointsCost = days === 7 ? 500 : Math.round((days / 7) * 500);

      // Verify user is an artisan
      const artisanProfile = await prisma.artisanProfile.findUnique({
        where: { userId },
      });
      if (!artisanProfile) {
        throw ApiError.forbidden('Only artisans can purchase directory search boosts.');
      }

      // Record point debit
      const idempotencyKey = `boost-artisan:${userId}:${Date.now()}`;
      await PointLedgerService.recordTransaction({
        userId,
        amount: -pointsCost,
        transactionType: 'DIRECTORY_BOOST_PURCHASE',
        idempotencyKey,
        referenceType: 'DIRECTORY_BOOST',
        referenceId: artisanProfile.id,
        description: `Featured profile boost for ${days} days`,
      });

      // Extend or set featured expiration
      const currentExpiry = artisanProfile.featuredExpiresAt && artisanProfile.featuredExpiresAt > new Date()
        ? artisanProfile.featuredExpiresAt
        : new Date();
      const newExpiry = new Date(currentExpiry.getTime() + days * 86400 * 1000);

      const updated = await prisma.artisanProfile.update({
        where: { id: artisanProfile.id },
        data: {
          isFeatured: true,
          featuredExpiresAt: newExpiry,
        },
      });

      res.status(200).json(
        new ApiResponse(
          200,
          {
            isFeatured: updated.isFeatured,
            featuredExpiresAt: updated.featuredExpiresAt,
            pointsDeducted: pointsCost,
          },
          'Directory boost successfully activated!'
        )
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Top ambassadors leaderboard.
   */
  static async getLeaderboard(req, res, next) {
    try {
      const topReferrers = await prisma.referral.groupBy({
        by: ['referrerId'],
        where: { status: 'REWARD_DISBURSED' },
        _count: { refereeId: true },
        orderBy: { _count: { refereeId: 'desc' } },
        take: 10,
      });

      const userIds = topReferrers.map((r) => r.referrerId);
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          role: true,
          clientProfile: { select: { firstName: true } },
          artisanProfile: { select: { firstName: true, businessName: true } },
          pointWallet: { select: { tier: true } },
        },
      });

      const userMap = new Map(users.map((u) => [u.id, u]));

      const leaderboard = topReferrers.map((entry, index) => {
        const user = userMap.get(entry.referrerId);
        const name =
          user?.role === 'ARTISAN'
            ? user.artisanProfile?.businessName || user.artisanProfile?.firstName || 'Artisan'
            : user?.clientProfile?.firstName || 'Client';
        return {
          rank: index + 1,
          name,
          tier: user?.pointWallet?.tier || 'BRONZE',
          successfulReferrals: entry._count.refereeId,
        };
      });

      res.status(200).json(new ApiResponse(200, leaderboard, 'Referral leaderboard fetched'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves paginated referral activity history for current user.
   */
  static async getReferralActivity(req, res, next) {
    try {
      const userId = req.user.id;
      const { page, limit } = req.query;
      const result = await ReferralService.getReferralActivity(userId, page, limit);
      res.status(200).json(new ApiResponse(200, result, 'Referral activity fetched'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Post-Signup 7-day grace period: Claim referral code.
   */
  static async claimReferralCode(req, res, next) {
    try {
      const userId = req.user.id;
      const { referralCode } = req.body;
      const result = await ReferralService.claimReferralCode(
        userId,
        referralCode,
        req.ip,
        req.headers['user-agent']
      );
      res.status(200).json(new ApiResponse(200, result, result.message));
    } catch (error) {
      next(error);
    }
  }
}
