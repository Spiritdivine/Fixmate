import prisma from '../config/db.js';
import { ApiError } from '../utils/api-error.js';
import { NotificationService } from './notification.service.js';

export class ProposalService {
  static async submitProposal(artisanId, data) {
    const { jobId, milestones, ...proposalData } = data;

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw ApiError.notFound('Job not found');
    if (job.status !== 'OPEN') throw ApiError.badRequest('This job is no longer accepting proposals');

    const existing = await prisma.proposal.findUnique({
      where: {
        jobId_artisanId: { jobId, artisanId },
      },
    });

    if (existing) throw ApiError.conflict('You have already submitted a proposal for this job');

    return prisma.$transaction(async (tx) => {
      const proposal = await tx.proposal.create({
        data: {
          jobId,
          artisanId,
          ...proposalData,
          milestones: milestones && milestones.length > 0
            ? {
                create: milestones.map((m) => ({
                  stepOrder: m.stepOrder,
                  title: m.title,
                  amount: m.amount,
                  estimatedDays: m.estimatedDays,
                })),
              }
            : undefined,
        },
        include: {
          milestones: { orderBy: { stepOrder: 'asc' } },
        },
      });

      await tx.job.update({
        where: { id: jobId },
        data: { proposalsCount: { increment: 1 } },
      });

      await NotificationService.createNotification(
        job.clientId,
        'New Proposal Received',
        `An artisan submitted a bid for "${job.title}" (₦${Number(proposal.bidAmount).toLocaleString()})`,
        `/jobs/${job.id}`
      );

      return proposal;
    });
  }

  static async updateProposal(artisanId, proposalId, data) {
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: { job: true },
    });

    if (!proposal) throw ApiError.notFound('Proposal not found');
    if (proposal.artisanId !== artisanId) throw ApiError.forbidden('Unauthorized: not proposal owner');
    if (proposal.status !== 'PENDING') {
      throw ApiError.badRequest('Cannot edit a proposal that has already been accepted, rejected, or withdrawn');
    }

    const { milestones, ...proposalData } = data;

    return prisma.$transaction(async (tx) => {
      if (milestones && Array.isArray(milestones)) {
        await tx.proposalMilestone.deleteMany({ where: { proposalId } });
        if (milestones.length > 0) {
          await tx.proposalMilestone.createMany({
            data: milestones.map((m) => ({
              proposalId,
              stepOrder: m.stepOrder,
              title: m.title,
              amount: m.amount,
              estimatedDays: m.estimatedDays,
            })),
          });
        }
      }

      return tx.proposal.update({
        where: { id: proposalId },
        data: proposalData,
        include: {
          milestones: { orderBy: { stepOrder: 'asc' } },
        },
      });
    });
  }

  static async updateProposalStatus(clientId, proposalId, status) {
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: { job: true },
    });

    if (!proposal) throw ApiError.notFound('Proposal not found');
    if (proposal.job.clientId !== clientId) throw ApiError.forbidden('Unauthorized access to proposal');

    const updated = await prisma.proposal.update({
      where: { id: proposalId },
      data: { status },
    });

    await NotificationService.createNotification(
      proposal.artisanId,
      `Proposal ${status === 'SHORTLISTED' ? 'Shortlisted' : 'Update'}`,
      `Your proposal for "${proposal.job.title}" has been marked as ${status.toLowerCase()}`,
      `/jobs/${proposal.jobId}`
    );

    return updated;
  }

  static async withdrawProposal(artisanId, proposalId) {
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
    });

    if (!proposal) throw ApiError.notFound('Proposal not found');
    if (proposal.artisanId !== artisanId) throw ApiError.forbidden('Unauthorized: not proposal owner');
    if (proposal.status === 'ACCEPTED') {
      throw ApiError.badRequest('Cannot withdraw an accepted proposal');
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.proposal.update({
        where: { id: proposalId },
        data: { status: 'WITHDRAWN' },
      });

      await tx.job.update({
        where: { id: proposal.jobId },
        data: { proposalsCount: { decrement: 1 } },
      });

      return updated;
    });
  }

  static async getProposalById(userId, proposalId) {
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: {
        job: {
          include: {
            client: { select: { id: true, email: true, clientProfile: true, avatarUrl: true } },
          },
        },
        artisan: {
          include: {
            artisanProfile: {
              include: { skills: { include: { skill: true } } },
            },
          },
        },
        milestones: { orderBy: { stepOrder: 'asc' } },
        contract: true,
      },
    });

    if (!proposal) throw ApiError.notFound('Proposal not found');
    if (proposal.artisanId !== userId && proposal.job.clientId !== userId) {
      throw ApiError.forbidden('Unauthorized access to proposal');
    }

    return proposal;
  }

  static async getJobProposals(clientId, jobId) {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw ApiError.notFound('Job not found');
    if (job.clientId !== clientId) throw ApiError.forbidden('Unauthorized access to job proposals');

    return prisma.proposal.findMany({
      where: { jobId },
      include: {
        artisan: {
          include: {
            artisanProfile: {
              include: { skills: { include: { skill: true } } },
            },
          },
        },
        milestones: { orderBy: { stepOrder: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getArtisanProposals(artisanId) {
    return prisma.proposal.findMany({
      where: { artisanId },
      include: {
        job: {
          include: { client: { include: { clientProfile: true } }, category: true },
        },
        milestones: { orderBy: { stepOrder: 'asc' } },
        contract: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export default ProposalService;
