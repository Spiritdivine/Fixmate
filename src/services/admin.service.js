import prisma from '../config/db.js';
import { ApiError } from '../utils/api-error.js';
import { NotificationService } from './notification.service.js';


export class AdminService {
  /**
   * Platform Analytics & Overview
   */
  static async getAnalyticsOverview() {
    const [
      totalUsers,
      totalArtisans,
      totalClients,
      pendingKycCount,
      totalJobs,
      activeJobs,
      totalContracts,
      activeContracts,
      disputedContracts,
      completedContracts,
      openDisputesCount,
      pendingPayoutsCount,
      transactionsAggregate,
      recentAuditLogs,
      recentUsers,
      recentContracts,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'ARTISAN' } }),
      prisma.user.count({ where: { role: 'CLIENT' } }),
      prisma.kycVerification.count({ where: { status: 'PENDING' } }),
      prisma.job.count(),
      prisma.job.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      prisma.contract.count(),
      prisma.contract.count({ where: { status: 'ACTIVE' } }),
      prisma.contract.count({ where: { status: 'DISPUTED' } }),
      prisma.contract.count({ where: { status: 'COMPLETED' } }),
      prisma.dispute.count({ where: { status: { in: ['OPEN', 'UNDER_REVIEW', 'AWAITING_EVIDENCE'] } } }),
      prisma.payoutRequest.count({ where: { status: 'PENDING' } }),
      prisma.contract.aggregate({
        _sum: {
          totalAmount: true,
          escrowFundedAmount: true,
          escrowReleasedAmount: true,
          escrowRefundedAmount: true,
          platformFeeAmount: true,
        },
      }),
      prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: { select: { id: true, email: true, role: true } },
        },
      }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          phoneNumber: true,
          role: true,
          status: true,
          isKycVerified: true,
          avatarUrl: true,
          createdAt: true,
        },
      }),
      prisma.contract.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          job: { select: { id: true, title: true } },
          client: { select: { id: true, email: true } },
          artisan: { select: { id: true, email: true } },
        },
      }),
    ]);

    return {
      metrics: {
        totalUsers,
        totalArtisans,
        totalClients,
        pendingKycCount,
        totalJobs,
        activeJobs,
        totalContracts,
        activeContracts,
        disputedContracts,
        completedContracts,
        openDisputesCount,
        pendingPayoutsCount,
        grossVolume: Number(transactionsAggregate._sum.totalAmount || 0),
        escrowFundedVolume: Number(transactionsAggregate._sum.escrowFundedAmount || 0),
        escrowReleasedVolume: Number(transactionsAggregate._sum.escrowReleasedAmount || 0),
        escrowRefundedVolume: Number(transactionsAggregate._sum.escrowRefundedAmount || 0),
        platformFeesEarned: Number(transactionsAggregate._sum.platformFeeAmount || 0),
      },
      recentAuditLogs: recentAuditLogs.map((l) => ({ ...l, id: l.id.toString() })),
      recentUsers,
      recentContracts,
    };
  }

  /**
   * User Management & Directory
   */
  static async getUsers({ page = 1, limit = 20, role, status, kycStatus, search } = {}) {
    const skip = (Number(page) - 1) * Number(limit);
    const where = {};

    if (role) where.role = role;
    if (status) where.status = status;
    if (kycStatus === 'VERIFIED') where.isKycVerified = true;
    if (kycStatus === 'UNVERIFIED') where.isKycVerified = false;

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search, mode: 'insensitive' } },
        { walletAddress: { contains: search, mode: 'insensitive' } },
        { clientProfile: { firstName: { contains: search, mode: 'insensitive' } } },
        { clientProfile: { lastName: { contains: search, mode: 'insensitive' } } },
        { artisanProfile: { businessName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          clientProfile: true,
          artisanProfile: {
            include: {
              skills: { include: { skill: true } },
            },
          },
          wallet: {
            select: {
              id: true,
              availableBalance: true,
              escrowLockedBalance: true,
              currency: true,
            },
          },
          kycSubmissions: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  static async getUserById(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        clientProfile: true,
        artisanProfile: {
          include: {
            skills: { include: { skill: true } },
            portfolios: true,
            services: true,
          },
        },
        wallet: {
          include: {
            transactions: {
              take: 20,
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        bankAccounts: true,
        kycSubmissions: {
          orderBy: { createdAt: 'desc' },
        },
        jobsAsClient: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        contractsAsClient: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { artisan: { select: { id: true, email: true } } },
        },
        contractsAsArtisan: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { client: { select: { id: true, email: true } } },
        },
        reviewsGiven: { take: 5, orderBy: { createdAt: 'desc' } },
        reviewsReceived: { take: 5, orderBy: { createdAt: 'desc' } },
        auditLogs: {
          take: 20,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) throw ApiError.notFound('User not found');
    return user;
  }

  static async updateUserStatus(adminId, userId, status, reason) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw ApiError.notFound('User not found');

    return prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { status },
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          isKycVerified: true,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: adminId,
          action: `USER_STATUS_CHANGE_${status}`,
          entityType: 'User',
          entityId: userId,
          oldState: { status: user.status },
          newState: { status, reason },
        },
      });

      return updatedUser;
    });
  }

  /**
   * Manually Verify User Compliance & Flags
   */
  static async manuallyVerifyUser(
    adminId,
    userId,
    {
      isKycVerified,
      isEmailVerified,
      isPhoneVerified,
      documentType = 'NIN',
      documentNumber,
      reason,
    }
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw ApiError.notFound('User not found');

    return prisma.$transaction(async (tx) => {
      const dataToUpdate = {};
      if (isKycVerified !== undefined) dataToUpdate.isKycVerified = isKycVerified;
      if (isEmailVerified !== undefined) dataToUpdate.isEmailVerified = isEmailVerified;
      if (isPhoneVerified !== undefined) dataToUpdate.isPhoneVerified = isPhoneVerified;

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: dataToUpdate,
        select: {
          id: true,
          email: true,
          phoneNumber: true,
          role: true,
          status: true,
          isKycVerified: true,
          isEmailVerified: true,
          isPhoneVerified: true,
        },
      });

      // If manual KYC verification is being enabled, log/create a KycVerification record
      if (isKycVerified !== undefined && isKycVerified) {
        await tx.kycVerification.create({
          data: {
            userId,
            documentType: documentType || 'NIN',
            documentNumber: documentNumber || `MANUAL-${Date.now().toString().slice(-6)}`,
            documentFrontUrl: 'https://placehold.co/600x400/1e1b4b/a855f7?text=Manually+Verified+by+Admin',
            selfieUrl: 'https://placehold.co/400x400/1e1b4b/a855f7?text=Admin+Manual+Verification',
            status: 'APPROVED',
            reviewedByAdminId: adminId,
            reviewedAt: new Date(),
          },
        });
      }

      // Record immutable audit log
      await tx.auditLog.create({
        data: {
          actorId: adminId,
          action: 'MANUAL_USER_VERIFICATION',
          entityType: 'User',
          entityId: userId,
          oldState: {
            isKycVerified: user.isKycVerified,
            isEmailVerified: user.isEmailVerified,
            isPhoneVerified: user.isPhoneVerified,
          },
          newState: {
            isKycVerified: updatedUser.isKycVerified,
            isEmailVerified: updatedUser.isEmailVerified,
            isPhoneVerified: updatedUser.isPhoneVerified,
            reason,
          },
        },
      });

      // Dispatch notification
      await NotificationService.createNotification(
        userId,
        isKycVerified ? 'Account KYC Verified' : 'Account Verification Updated',
        `Your verification status has been updated by Fixmate Administration: "${reason}"`,
        '/kyc'
      );

      return updatedUser;
    });
  }


  /**
   * KYC Verification Queue
   */
  static async getKycSubmissions({ page = 1, limit = 20, status, documentType, search } = {}) {
    const skip = (Number(page) - 1) * Number(limit);
    const where = {};

    if (status) where.status = status;
    if (documentType) where.documentType = documentType;

    if (search) {
      where.user = {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { phoneNumber: { contains: search, mode: 'insensitive' } },
          { clientProfile: { firstName: { contains: search, mode: 'insensitive' } } },
          { clientProfile: { lastName: { contains: search, mode: 'insensitive' } } },
          { artisanProfile: { businessName: { contains: search, mode: 'insensitive' } } },
        ],
      };
    }

    const [submissions, total] = await Promise.all([
      prisma.kycVerification.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phoneNumber: true,
              role: true,
              isKycVerified: true,
              avatarUrl: true,
              clientProfile: true,
              artisanProfile: true,
            },
          },
          reviewedByAdmin: {
            select: { id: true, email: true, role: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.kycVerification.count({ where }),
    ]);

    return {
      submissions,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  /**
   * Disputes Oversight
   */
  static async getDisputes({ page = 1, limit = 20, status, search } = {}) {
    const skip = (Number(page) - 1) * Number(limit);
    const where = {};

    if (status) where.status = status;

    if (search) {
      where.OR = [
        { disputeCode: { contains: search, mode: 'insensitive' } },
        { reason: { contains: search, mode: 'insensitive' } },
        { contract: { contractCode: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [disputes, total] = await Promise.all([
      prisma.dispute.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          contract: {
            include: {
              client: { select: { id: true, email: true, avatarUrl: true, clientProfile: true } },
              artisan: { select: { id: true, email: true, avatarUrl: true, artisanProfile: true } },
              job: { select: { id: true, title: true } },
            },
          },
          milestone: true,
          initiatedByUser: { select: { id: true, email: true, role: true } },
          evidences: true,
          _count: { select: { messages: true, evidences: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.dispute.count({ where }),
    ]);

    return {
      disputes,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  static async getDisputeById(disputeId) {
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        contract: {
          include: {
            client: { select: { id: true, email: true, avatarUrl: true, clientProfile: true } },
            artisan: { select: { id: true, email: true, avatarUrl: true, artisanProfile: true } },
            job: true,
            milestones: { orderBy: { stepOrder: 'asc' } },
          },
        },
        milestone: true,
        initiatedByUser: { select: { id: true, email: true, role: true, avatarUrl: true } },
        resolvedByAdmin: { select: { id: true, email: true, role: true } },
        evidences: {
          include: { uploader: { select: { id: true, email: true, role: true } } },
          orderBy: { createdAt: 'asc' },
        },
        messages: {
          include: { sender: { select: { id: true, email: true, role: true, avatarUrl: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!dispute) throw ApiError.notFound('Dispute not found');
    return dispute;
  }

  /**
   * Contracts & Escrow Oversight
   */
  static async getContracts({ page = 1, limit = 20, status, search } = {}) {
    const skip = (Number(page) - 1) * Number(limit);
    const where = {};

    if (status) where.status = status;

    if (search) {
      where.OR = [
        { contractCode: { contains: search, mode: 'insensitive' } },
        { job: { title: { contains: search, mode: 'insensitive' } } },
        { client: { email: { contains: search, mode: 'insensitive' } } },
        { artisan: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [contracts, total] = await Promise.all([
      prisma.contract.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          job: { select: { id: true, title: true, budgetType: true } },
          client: { select: { id: true, email: true, avatarUrl: true, clientProfile: true } },
          artisan: { select: { id: true, email: true, avatarUrl: true, artisanProfile: true } },
          milestones: { orderBy: { stepOrder: 'asc' } },
          disputes: { select: { id: true, disputeCode: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.contract.count({ where }),
    ]);

    return {
      contracts,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  static async getContractById(contractId) {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        job: { include: { category: true, skills: { include: { skill: true } } } },
        proposal: true,
        client: { select: { id: true, email: true, phoneNumber: true, avatarUrl: true, clientProfile: true } },
        artisan: { select: { id: true, email: true, phoneNumber: true, avatarUrl: true, artisanProfile: true } },
        milestones: { orderBy: { stepOrder: 'asc' } },
        disputes: { include: { evidences: true } },
        reviews: true,
        transactions: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!contract) throw ApiError.notFound('Contract not found');
    return contract;
  }

  /**
   * Financial Ledger & Transactions
   */
  static async getTransactions({ page = 1, limit = 25, type, status, search } = {}) {
    const skip = (Number(page) - 1) * Number(limit);
    const where = {};

    if (type) where.type = type;
    if (status) where.status = status;

    if (search) {
      where.OR = [
        { reference: { contains: search, mode: 'insensitive' } },
        { paymentGatewayRef: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { wallet: { user: { email: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          wallet: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  role: true,
                  clientProfile: true,
                  artisanProfile: true,
                },
              },
            },
          },
          contract: { select: { id: true, contractCode: true } },
          milestone: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.transaction.count({ where }),
    ]);

    return {
      transactions,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  /**
   * Artisan Payout Requests
   */
  static async getPayouts({ page = 1, limit = 20, status, search } = {}) {
    const skip = (Number(page) - 1) * Number(limit);
    const where = {};

    if (status) where.status = status;

    if (search) {
      where.OR = [
        { reference: { contains: search, mode: 'insensitive' } },
        { gatewayTransferCode: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [payouts, total] = await Promise.all([
      prisma.payoutRequest.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phoneNumber: true,
              artisanProfile: true,
            },
          },
          bankAccount: true,
          wallet: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.payoutRequest.count({ where }),
    ]);

    return {
      payouts,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  static async updatePayoutStatus(adminId, payoutId, { status, gatewayTransferCode, failureReason }) {
    const payout = await prisma.payoutRequest.findUnique({
      where: { id: payoutId },
      include: { wallet: true, user: true },
    });

    if (!payout) throw ApiError.notFound('Payout request not found');

    return prisma.$transaction(async (tx) => {
      // If status is changed to REJECTED, refund the money back to the wallet
      if (status === 'REJECTED' && payout.status !== 'REJECTED') {
        await tx.wallet.update({
          where: { id: payout.walletId },
          data: {
            availableBalance: { increment: Number(payout.amount) },
          },
        });
      }

      const updatedPayout = await tx.payoutRequest.update({
        where: { id: payoutId },
        data: {
          status,
          gatewayTransferCode: gatewayTransferCode || payout.gatewayTransferCode,
          failureReason: failureReason || (status === 'REJECTED' ? 'Rejected by administrator' : null),
          processedAt: status === 'COMPLETED' || status === 'REJECTED' ? new Date() : payout.processedAt,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: adminId,
          action: `PAYOUT_STATUS_UPDATE_${status}`,
          entityType: 'PayoutRequest',
          entityId: payoutId,
          oldState: { status: payout.status },
          newState: { status, gatewayTransferCode, failureReason },
        },
      });

      return updatedPayout;
    });
  }

  /**
   * Reviews Moderation & Trust
   */
  static async getReviews({ page = 1, limit = 20, isPublic, minRating, maxRating, search } = {}) {
    const skip = (Number(page) - 1) * Number(limit);
    const where = {};

    if (isPublic !== undefined) where.isPublic = isPublic === 'true' || isPublic === true;
    if (minRating) where.overallRating = { ...where.overallRating, gte: Number(minRating) };
    if (maxRating) where.overallRating = { ...where.overallRating, lte: Number(maxRating) };

    if (search) {
      where.OR = [
        { comment: { contains: search, mode: 'insensitive' } },
        { artisanReply: { contains: search, mode: 'insensitive' } },
        { reviewer: { email: { contains: search, mode: 'insensitive' } } },
        { reviewee: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          reviewer: { select: { id: true, email: true, avatarUrl: true, clientProfile: true } },
          reviewee: { select: { id: true, email: true, avatarUrl: true, artisanProfile: true } },
          contract: { select: { id: true, contractCode: true, job: { select: { id: true, title: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.review.count({ where }),
    ]);

    return {
      reviews,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  static async toggleReviewVisibility(adminId, reviewId, isPublic) {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw ApiError.notFound('Review not found');

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: { isPublic },
    });

    await prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: isPublic ? 'REVIEW_MADE_PUBLIC' : 'REVIEW_HIDDEN',
        entityType: 'Review',
        entityId: reviewId,
        oldState: { isPublic: review.isPublic },
        newState: { isPublic },
      },
    });

    return updated;
  }

  /**
   * Job Category Management
   */
  static async getCategoriesWithStats() {
    const categories = await prisma.jobCategory.findMany({
      include: {
        skills: true,
        children: true,
        _count: {
          select: { jobs: true, skills: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return categories;
  }

  static async createCategory(data) {
    const existing = await prisma.jobCategory.findUnique({
      where: { slug: data.slug },
    });
    if (existing) {
      throw ApiError.conflict('Category with this slug already exists');
    }

    return prisma.jobCategory.create({
      data: {
        name: data.name,
        slug: data.slug,
        parentId: data.parentId ? Number(data.parentId) : null,
        iconUrl: data.iconUrl || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });
  }

  static async updateCategory(id, data) {
    const numId = Number(id);
    const category = await prisma.jobCategory.findUnique({ where: { id: numId } });
    if (!category) throw ApiError.notFound('Category not found');

    if (data.slug && data.slug !== category.slug) {
      const existing = await prisma.jobCategory.findUnique({ where: { slug: data.slug } });
      if (existing) throw ApiError.conflict('Category with this slug already exists');
    }

    return prisma.jobCategory.update({
      where: { id: numId },
      data: {
        ...data,
        parentId: data.parentId !== undefined ? (data.parentId ? Number(data.parentId) : null) : undefined,
      },
    });
  }

  static async deleteCategory(id) {
    const numId = Number(id);
    const category = await prisma.jobCategory.findUnique({ where: { id: numId } });
    if (!category) throw ApiError.notFound('Category not found');

    return prisma.jobCategory.update({
      where: { id: numId },
      data: { isActive: false },
    });
  }

  /**
   * Skill Management
   */
  static async getSkillsWithStats({ categoryId } = {}) {
    const where = {};
    if (categoryId) where.categoryId = Number(categoryId);

    return prisma.skill.findMany({
      where,
      include: {
        category: true,
        _count: {
          select: { artisans: true, jobs: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  static async createSkill(data) {
    const existing = await prisma.skill.findUnique({
      where: { slug: data.slug },
    });
    if (existing) {
      throw ApiError.conflict('Skill with this slug already exists');
    }

    return prisma.skill.create({
      data: {
        categoryId: Number(data.categoryId),
        name: data.name,
        slug: data.slug,
      },
      include: { category: true },
    });
  }

  static async updateSkill(id, data) {
    const numId = Number(id);
    const skill = await prisma.skill.findUnique({ where: { id: numId } });
    if (!skill) throw ApiError.notFound('Skill not found');

    return prisma.skill.update({
      where: { id: numId },
      data: {
        ...(data.categoryId ? { categoryId: Number(data.categoryId) } : {}),
        ...(data.name ? { name: data.name } : {}),
        ...(data.slug ? { slug: data.slug } : {}),
      },
      include: { category: true },
    });
  }

  static async deleteSkill(id) {
    const numId = Number(id);
    const skill = await prisma.skill.findUnique({ where: { id: numId } });
    if (!skill) throw ApiError.notFound('Skill not found');

    return prisma.skill.delete({
      where: { id: numId },
    });
  }

  /**
   * Audit Logs
   */
  static async getAuditLogs({ page = 1, limit = 50, action, entityType } = {}) {
    const skip = (Number(page) - 1) * Number(limit);
    const where = {
      ...(action ? { action: { contains: action, mode: 'insensitive' } } : {}),
      ...(entityType ? { entityType: { equals: entityType, mode: 'insensitive' } } : {}),
    };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          actor: { select: { id: true, email: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs: logs.map((l) => ({ ...l, id: l.id.toString() })),
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  /**
   * System Settings
   */
  static async getSystemSettings() {
    return prisma.systemSetting.findMany({
      orderBy: { key: 'asc' },
    });
  }

  static async updateSystemSetting(adminId, key, value, description) {
    return prisma.systemSetting.upsert({
      where: { key },
      update: {
        value,
        ...(description ? { description } : {}),
        updatedBy: adminId,
      },
      create: {
        key,
        value,
        description: description || null,
        updatedBy: adminId,
      },
    });
  }
}

export default AdminService;
