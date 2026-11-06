import prisma from '../config/db.js';
import { PointLedgerService } from './point-ledger.service.js';
import { ReferralFraudService } from './referral-fraud.service.js';
import { enqueueNotification } from '../queues/queue.manager.js';
import { ApiError } from '../utils/api-error.js';
import { generateReferralCode } from '../utils/code-generator.js';

export class ReferralService {
  /**
   * Validates a referral code (for registration pre-check).
   */
  static async validateCode(referralCode) {
    if (!referralCode || typeof referralCode !== 'string') {
      throw ApiError.badRequest('Referral code is required.');
    }

    const normalized = referralCode.trim().toUpperCase();
    const referrer = await prisma.user.findUnique({
      where: { referralCode: normalized },
      select: {
        id: true,
        role: true,
        clientProfile: { select: { firstName: true, lastName: true } },
        artisanProfile: { select: { firstName: true, lastName: true, businessName: true } },
      },
    });

    if (!referrer) {
      return {
        isValid: false,
        message: 'Invalid referral code.',
      };
    }

    const name =
      referrer.role === 'ARTISAN'
        ? referrer.artisanProfile?.businessName || referrer.artisanProfile?.firstName || 'Artisan Partner'
        : referrer.clientProfile?.firstName || 'Artisan Community Member';

    return {
      isValid: true,
      referrerName: name,
      refereeRewardPoints: 150,
      referrerRewardPoints: 250,
      description: 'You will receive 150 bonus points on your first completed job!',
    };
  }

  /**
   * Attaches an incoming user to a referrer during registration.
   */
  static async registerReferralAttribution({
    refereeId,
    referralCode,
    clientIp,
    deviceData,
  }) {
    if (!referralCode) return null;

    const normalizedCode = referralCode.trim().toUpperCase();
    const referrer = await prisma.user.findUnique({
      where: { referralCode: normalizedCode },
    });

    if (!referrer) {
      console.warn(`[Referral] Referral code ${normalizedCode} not found during signup attribution.`);
      return null;
    }

    if (referrer.id === refereeId) {
      console.warn(`[Referral] Self-referral attempt blocked for user ${refereeId}.`);
      return null;
    }

    const deviceHash = ReferralFraudService.generateDeviceHash(deviceData);

    // Compute fraud risk
    const risk = await ReferralFraudService.evaluateRisk({
      referrerId: referrer.id,
      refereeId,
      clientIp,
      deviceHash,
    });

    // 60-day qualification window
    const qualificationDeadline = new Date(Date.now() + 60 * 86400 * 1000);

    const attribution = await prisma.referral.create({
      data: {
        referrerId: referrer.id,
        refereeId,
        referralCodeUsed: normalizedCode,
        status: risk.blocked ? 'FLAGGED_FRAUD' : 'PENDING_QUALIFICATION',
        fraudRiskScore: risk.score,
        fraudFlags: risk.flags,
        qualificationDeadline,
        referrerRewardPoints: 250,
        refereeRewardPoints: 150,
      },
    });

    // Link back to User record
    await prisma.user.update({
      where: { id: refereeId },
      data: {
        referredById: referrer.id,
        deviceFingerprintHash: deviceHash,
        registrationIp: clientIp,
      },
    });

    // Notify referrer that a friend joined with their code
    try {
      const referee = await prisma.user.findUnique({
        where: { id: refereeId },
        select: {
          role: true,
          clientProfile: { select: { firstName: true } },
          artisanProfile: { select: { firstName: true, businessName: true } },
        },
      });

      const friendName =
        referee?.role === 'ARTISAN'
          ? referee.artisanProfile?.businessName || referee.artisanProfile?.firstName || 'A new artisan'
          : referee?.clientProfile?.firstName || 'A friend';

      await enqueueNotification({
        userId: referrer.id,
        title: 'Friend Joined FixMate! 🎉',
        message: `${friendName} just signed up with your invite code. You'll receive 250 points (₦1,250 credit) upon their first job completion!`,
        actionUrl: '/wallet/points',
        type: 'REFERRAL_SUCCESS',
      });
    } catch (notifErr) {
      console.warn('[ReferralService] Friend join notification warning:', notifErr.message);
    }

    return attribution;
  }

  /**
   * Post-Signup 7-Day Grace Period: Claim referral code after account creation.
   */
  static async claimReferralCode(userId, referralCode, clientIp = null, deviceData = null) {
    if (!referralCode || typeof referralCode !== 'string') {
      throw ApiError.badRequest('Referral code is required.');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, createdAt: true, referredById: true },
    });

    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    if (user.referredById) {
      throw ApiError.badRequest('You have already claimed or been linked with a referral code.');
    }

    // 7-day grace period check
    const SEVEN_DAYS_MS = 7 * 86400 * 1000;
    if (Date.now() - new Date(user.createdAt).getTime() > SEVEN_DAYS_MS) {
      throw ApiError.badRequest('Referral codes can only be claimed within 7 days of account registration.');
    }

    // Check if user has already completed a job
    const completedJobsCount = await prisma.contract.count({
      where: {
        OR: [{ clientId: userId }, { artisanId: userId }],
        status: 'COMPLETED',
      },
    });

    if (completedJobsCount > 0) {
      throw ApiError.badRequest('Referral codes can only be claimed before completing your first job.');
    }

    const attribution = await this.registerReferralAttribution({
      refereeId: userId,
      referralCode,
      clientIp,
      deviceData,
    });

    if (!attribution) {
      throw ApiError.badRequest('Unable to apply referral code. Self-referrals or duplicate links are not allowed.');
    }

    return {
      success: true,
      message: 'Referral code successfully applied! 150 points will be credited upon your first job completion.',
      attribution,
    };
  }

  /**
   * Triggered upon contract completion / escrow release.
   */
  static async evaluateContractQualification(contractId) {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract || contract.status !== 'COMPLETED') {
      return;
    }

    // Minimum qualification value: ₦10,000 (10,000.00 NGN)
    const totalAmount = Number(contract.totalAmount);
    if (totalAmount < 10000) {
      console.log(`[Referral] Contract ${contractId} total (₦${totalAmount}) below ₦10,000 threshold. Skipping referral qualification.`);
      return;
    }

    // Check if client was referred and is pending
    const clientReferral = await prisma.referral.findFirst({
      where: {
        refereeId: contract.clientId,
        status: 'PENDING_QUALIFICATION',
      },
    });

    if (clientReferral) {
      await this.disburseRewards(clientReferral.id, contract.id);
    }

    // Check if artisan was referred and is pending
    const artisanReferral = await prisma.referral.findFirst({
      where: {
        refereeId: contract.artisanId,
        status: 'PENDING_QUALIFICATION',
      },
    });

    if (artisanReferral) {
      await this.disburseRewards(artisanReferral.id, contract.id);
    }
  }

  /**
   * Atomically disburses referral reward points via PointLedgerService.
   */
  static async disburseRewards(referralId, qualifyingContractId) {
    const referral = await prisma.referral.findUnique({
      where: { id: referralId },
      include: { referrer: true, referee: true },
    });

    if (!referral || referral.status !== 'PENDING_QUALIFICATION') {
      return;
    }

    if (new Date() > referral.qualificationDeadline) {
      await prisma.referral.update({
        where: { id: referral.id },
        data: { status: 'EXPIRED' },
      });
      return;
    }

    // 1. Credit Referrer
    await PointLedgerService.recordTransaction({
      userId: referral.referrerId,
      amount: referral.referrerRewardPoints,
      transactionType: 'REFERRAL_SIGNUP_BONUS_REFERRER',
      idempotencyKey: `ref-reward-referrer:${referral.id}`,
      referenceType: 'REFERRAL',
      referenceId: referral.id,
      description: `Referral bonus: Your invitee completed their first verified job!`,
    });

    // 2. Credit Referee
    await PointLedgerService.recordTransaction({
      userId: referral.refereeId,
      amount: referral.refereeRewardPoints,
      transactionType: 'REFERRAL_SIGNUP_BONUS_REFEREE',
      idempotencyKey: `ref-reward-referee:${referral.id}`,
      referenceType: 'REFERRAL',
      referenceId: referral.id,
      description: `Welcome bonus: You completed your first verified job!`,
    });

    // 3. Mark Referral as Disbursed
    await prisma.referral.update({
      where: { id: referral.id },
      data: {
        status: 'REWARD_DISBURSED',
        qualifiedAt: new Date(),
        qualifyingContractId,
      },
    });

    // 4. Send Real-Time Notifications
    try {
      await Promise.all([
        enqueueNotification({
          userId: referral.referrerId,
          title: '🎉 250 Points Earned!',
          message: `Your referral finished their first job. 250 points have been added to your wallet!`,
          actionUrl: '/wallet/points',
          type: 'REFERRAL_SUCCESS',
        }),
        enqueueNotification({
          userId: referral.refereeId,
          title: '🌟 150 Welcome Points Unlocked!',
          message: `Congratulations on finishing your first job! 150 points are ready to use.`,
          actionUrl: '/wallet/points',
          type: 'REFERRAL_SUCCESS',
        }),
      ]);
    } catch (notifErr) {
      console.warn('[Referral] Notification enqueue failed:', notifErr.message);
    }
  }

  /**
   * Fetches user referral statistics and link.
   */
  static async getReferralStats(userId) {
    let user = await prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    });

    let code = user?.referralCode;
    if (!code) {
      code = generateReferralCode('FIX');
      await prisma.user.update({
        where: { id: userId },
        data: { referralCode: code },
      });
    }

    const [totalInvited, totalQualified, pendingReferrals] = await Promise.all([
      prisma.referral.count({ where: { referrerId: userId } }),
      prisma.referral.count({ where: { referrerId: userId, status: 'REWARD_DISBURSED' } }),
      prisma.referral.count({ where: { referrerId: userId, status: 'PENDING_QUALIFICATION' } }),
    ]);

    const shareUrl = `https://artisan.ng/join?ref=${code}`;

    return {
      code,
      shareUrl,
      totalInvited,
      totalQualified,
      pendingBonusPoints: pendingReferrals * 250,
      nairaEquivalentPending: pendingReferrals * 250 * 5, // 1 pt = ₦5
      nairaEquivalentEarned: totalQualified * 250 * 5,
    };
  }

  /**
   * Fetches paginated activity log of all friends who joined using this user's code.
   */
  static async getReferralActivity(userId, page = 1, limit = 20) {
    const take = Math.min(Math.max(Number(limit) || 20, 1), 50);
    const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

    const [total, referrals] = await Promise.all([
      prisma.referral.count({ where: { referrerId: userId } }),
      prisma.referral.findMany({
        where: { referrerId: userId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          referee: {
            select: {
              id: true,
              role: true,
              createdAt: true,
              clientProfile: { select: { firstName: true, lastName: true } },
              artisanProfile: { select: { firstName: true, lastName: true, businessName: true } },
            },
          },
        },
      }),
    ]);

    const items = referrals.map((ref) => {
      let displayName = 'Member';
      if (ref.referee?.role === 'ARTISAN' && ref.referee.artisanProfile?.businessName) {
        displayName = ref.referee.artisanProfile.businessName;
      } else if (ref.referee?.clientProfile?.firstName) {
        const first = ref.referee.clientProfile.firstName;
        const lastInit = ref.referee.clientProfile.lastName ? `${ref.referee.clientProfile.lastName[0]}.` : '';
        displayName = `${first} ${lastInit}`.trim();
      } else if (ref.referee?.artisanProfile?.firstName) {
        const first = ref.referee.artisanProfile.firstName;
        const lastInit = ref.referee.artisanProfile.lastName ? `${ref.referee.artisanProfile.lastName[0]}.` : '';
        displayName = `${first} ${lastInit}`.trim();
      }

      return {
        id: ref.id,
        refereeId: ref.refereeId,
        refereeName: displayName,
        role: ref.referee?.role || 'CLIENT',
        status: ref.status, // PENDING_QUALIFICATION | REWARD_DISBURSED | REWARD_REVOKED
        pointsEarned: ref.status === 'REWARD_DISBURSED' ? 250 : 0,
        potentialPoints: 250,
        nairaValue: ref.status === 'REWARD_DISBURSED' ? 1250 : 0,
        potentialNairaValue: 1250,
        date: ref.createdAt,
        qualifiedAt: ref.qualifiedAt,
      };
    });

    return {
      items,
      pagination: {
        total,
        page: Number(page) || 1,
        limit: take,
        totalPages: Math.ceil(total / take) || 1,
      },
    };
  }
}
