import prisma from '../config/db.js';
import { ApiError } from '../utils/api-error.js';
import { NotificationService } from './notification.service.js';

export class JobService {
  static async createJob(clientId, data) {
    const { skillIds, attachments, ...jobData } = data;

    if (jobData.budgetMin > jobData.budgetMax) {
      throw ApiError.badRequest('Minimum budget cannot exceed maximum budget');
    }

    const job = await prisma.job.create({
      data: {
        clientId,
        ...jobData,
        deadlineDate: jobData.deadlineDate ? new Date(jobData.deadlineDate) : null,
        skills: skillIds && skillIds.length > 0
          ? {
              create: skillIds.map((skillId) => ({ skillId })),
            }
          : undefined,
        attachments: attachments && attachments.length > 0
          ? {
              create: attachments.map((att) => ({
                fileUrl: att.fileUrl,
                fileName: att.fileName,
                fileSizeBytes: BigInt(att.fileSizeBytes),
                mimeType: att.mimeType,
              })),
            }
          : undefined,
      },
      include: {
        category: true,
        skills: { include: { skill: true } },
        attachments: true,
      },
    });

    return {
      ...job,
      attachments: job.attachments.map((a) => ({
        ...a,
        fileSizeBytes: a.fileSizeBytes.toString(),
      })),
    };
  }

  static async updateJob(clientId, jobId, data) {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw ApiError.notFound('Job not found');
    if (job.clientId !== clientId) throw ApiError.forbidden('Unauthorized: not job owner');
    if (job.status !== 'OPEN' && job.status !== 'DRAFT') {
      throw ApiError.badRequest('Cannot update a job that is already in progress or completed');
    }

    const { skillIds, ...jobData } = data;

    if (jobData.budgetMin && jobData.budgetMax && jobData.budgetMin > jobData.budgetMax) {
      throw ApiError.badRequest('Minimum budget cannot exceed maximum budget');
    }

    return prisma.$transaction(async (tx) => {
      if (skillIds && Array.isArray(skillIds)) {
        await tx.jobSkill.deleteMany({ where: { jobId } });
        if (skillIds.length > 0) {
          await tx.jobSkill.createMany({
            data: skillIds.map((skillId) => ({ jobId, skillId })),
          });
        }
      }

      const updated = await tx.job.update({
        where: { id: jobId },
        data: {
          ...jobData,
          deadlineDate: jobData.deadlineDate ? new Date(jobData.deadlineDate) : undefined,
        },
        include: {
          category: true,
          skills: { include: { skill: true } },
          attachments: true,
        },
      });

      return {
        ...updated,
        attachments: updated.attachments.map((a) => ({
          ...a,
          fileSizeBytes: a.fileSizeBytes.toString(),
        })),
      };
    });
  }

  static async updateJobStatus(clientId, jobId, status) {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw ApiError.notFound('Job not found');
    if (job.clientId !== clientId) throw ApiError.forbidden('Unauthorized: not job owner');

    return prisma.job.update({
      where: { id: jobId },
      data: { status },
    });
  }

  static async deleteJob(clientId, jobId) {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        contracts: {
          where: { status: { in: ['ACTIVE', 'PENDING_FUNDING', 'DISPUTED'] } },
        },
      },
    });

    if (!job) throw ApiError.notFound('Job not found');
    if (job.clientId !== clientId) throw ApiError.forbidden('Unauthorized: not job owner');
    if (job.contracts && job.contracts.length > 0) {
      throw ApiError.badRequest('Cannot delete a job with active or pending contracts');
    }

    return prisma.job.delete({
      where: { id: jobId },
    });
  }

  static async deleteJobAttachment(clientId, jobId, attachmentId) {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw ApiError.notFound('Job not found');
    if (job.clientId !== clientId) throw ApiError.forbidden('Unauthorized: not job owner');

    const attachment = await prisma.jobAttachment.findUnique({ where: { id: attachmentId } });
    if (!attachment || attachment.jobId !== jobId) {
      throw ApiError.notFound('Attachment not found');
    }

    return prisma.jobAttachment.delete({
      where: { id: attachmentId },
    });
  }

  static async getJobs(filters = {}) {
    const { categoryId, state, lgaCity, status = 'OPEN', minBudget, maxBudget, search, page = 1, limit = 20 } = filters;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {
      ...(status && { status }),
      ...(categoryId && { categoryId: Number(categoryId) }),
      ...(state && { state: { equals: state, mode: 'insensitive' } }),
      ...(lgaCity && { lgaCity: { equals: lgaCity, mode: 'insensitive' } }),
      ...(minBudget && { budgetMax: { gte: Number(minBudget) } }),
      ...(maxBudget && { budgetMin: { lte: Number(maxBudget) } }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          client: {
            select: { id: true, email: true, clientProfile: true, avatarUrl: true },
          },
          category: true,
          skills: { include: { skill: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.job.count({ where }),
    ]);

    return {
      jobs,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  static async getJobById(id) {
    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        client: {
          select: { id: true, email: true, clientProfile: true, avatarUrl: true },
        },
        category: true,
        skills: { include: { skill: true } },
        attachments: true,
      },
    });

    if (!job) throw ApiError.notFound('Job not found');

    return {
      ...job,
      attachments: job.attachments.map((a) => ({
        ...a,
        fileSizeBytes: a.fileSizeBytes.toString(),
      })),
    };
  }

  static async getClientJobs(clientId) {
    return prisma.job.findMany({
      where: { clientId },
      include: {
        category: true,
        proposals: {
          include: {
            artisan: {
              include: { artisanProfile: true },
            },
          },
        },
        contracts: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Job Invitations
   */
  static async inviteArtisan(clientId, jobId, artisanId) {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw ApiError.notFound('Job not found');
    if (job.clientId !== clientId) throw ApiError.forbidden('Unauthorized: not job owner');

    const artisan = await prisma.user.findUnique({ where: { id: artisanId } });
    if (!artisan || artisan.role !== 'ARTISAN') {
      throw ApiError.badRequest('Invalid artisan recipient');
    }

    const invitation = await prisma.jobInvitation.upsert({
      where: { jobId_artisanId: { jobId, artisanId } },
      update: { status: 'PENDING' },
      create: {
        jobId,
        artisanId,
        status: 'PENDING',
      },
      include: { job: true },
    });

    await NotificationService.createNotification(
      artisanId,
      'New Job Invitation',
      `You have been invited to apply for "${job.title}"`,
      `/jobs/${job.id}`
    );

    return invitation;
  }

  static async getArtisanInvitations(artisanId) {
    return prisma.jobInvitation.findMany({
      where: { artisanId },
      include: {
        job: {
          include: {
            category: true,
            client: { select: { id: true, email: true, clientProfile: true, avatarUrl: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async respondToInvitation(artisanId, invitationId, status) {
    const invitation = await prisma.jobInvitation.findUnique({ where: { id: invitationId } });
    if (!invitation || invitation.artisanId !== artisanId) {
      throw ApiError.notFound('Invitation not found');
    }

    return prisma.jobInvitation.update({
      where: { id: invitationId },
      data: { status },
    });
  }

  static async cancelInvitation(clientId, invitationId) {
    const invitation = await prisma.jobInvitation.findUnique({
      where: { id: invitationId },
      include: { job: true },
    });

    if (!invitation || invitation.job.clientId !== clientId) {
      throw ApiError.notFound('Invitation not found or unauthorized');
    }

    return prisma.jobInvitation.delete({
      where: { id: invitationId },
    });
  }

  /**
   * Saved Jobs (Bookmarks)
   */
  static async saveJob(userId, jobId) {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw ApiError.notFound('Job not found');

    return prisma.savedJob.upsert({
      where: { userId_jobId: { userId, jobId } },
      update: {},
      create: { userId, jobId },
    });
  }

  static async unsaveJob(userId, jobId) {
    return prisma.savedJob.deleteMany({
      where: { userId, jobId },
    });
  }

  static async getSavedJobs(userId) {
    const saved = await prisma.savedJob.findMany({
      where: { userId },
      include: {
        job: {
          include: {
            category: true,
            skills: { include: { skill: true } },
            client: { select: { id: true, email: true, clientProfile: true, avatarUrl: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return saved.map((s) => s.job);
  }
}

export default JobService;
