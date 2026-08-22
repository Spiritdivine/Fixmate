import prisma from '../config/db.js';
import { ApiError } from '../utils/api-error.js';
import { env } from '../config/env.js';
import { NotificationService } from './notification.service.js';

export class ContractService {
  static async acceptProposalAndCreateContract(clientId, proposalId) {
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: {
        job: true,
        milestones: { orderBy: { stepOrder: 'asc' } },
      },
    });

    if (!proposal) throw ApiError.notFound('Proposal not found');
    if (proposal.job.clientId !== clientId) throw ApiError.forbidden('Unauthorized action');
    if (proposal.job.status !== 'OPEN') throw ApiError.badRequest('Job is no longer open');

    const platformFeePercent = parseFloat(env.ESCROW_FEE_PERCENT || '5.00');
    const totalAmount = Number(proposal.bidAmount);
    const platformFeeAmount = Number(((totalAmount * platformFeePercent) / 100).toFixed(2));

    const contractCode = `CTR-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    return prisma.$transaction(async (tx) => {
      // 1. Accept this proposal and reject others
      await tx.proposal.update({
        where: { id: proposalId },
        data: { status: 'ACCEPTED' },
      });

      await tx.proposal.updateMany({
        where: { jobId: proposal.jobId, id: { not: proposalId } },
        data: { status: 'REJECTED' },
      });

      // 2. Set job status to IN_PROGRESS
      await tx.job.update({
        where: { id: proposal.jobId },
        data: { status: 'IN_PROGRESS' },
      });

      // 3. Create Contract
      const contract = await tx.contract.create({
        data: {
          contractCode,
          jobId: proposal.jobId,
          proposalId,
          clientId,
          artisanId: proposal.artisanId,
          totalAmount,
          platformFeePercent,
          platformFeeAmount,
          status: 'PENDING_FUNDING',
          // If proposal had milestones, instantiate them
          milestones: proposal.milestones.length > 0
            ? {
                create: proposal.milestones.map((m) => ({
                  stepOrder: m.stepOrder,
                  title: m.title,
                  amount: m.amount,
                  status: 'PENDING_FUNDING',
                })),
              }
            : {
                create: [
                  {
                    stepOrder: 1,
                    title: 'Full Project Deliverable',
                    amount: totalAmount,
                    status: 'PENDING_FUNDING',
                  },
                ],
              },
        },
        include: {
          milestones: { orderBy: { stepOrder: 'asc' } },
          artisan: { select: { id: true, email: true, artisanProfile: true } },
          client: { select: { id: true, email: true, clientProfile: true } },
        },
      });

      // 4. Create dedicated Conversation Channel for Contract
      await tx.conversation.create({
        data: {
          contractId: contract.id,
          participants: {
            create: [{ userId: clientId }, { userId: proposal.artisanId }],
          },
        },
      });

      await NotificationService.createNotification(
        proposal.artisanId,
        'Proposal Accepted!',
        `Your bid for "${proposal.job.title}" was accepted! Contract #${contract.contractCode} is ready for funding.`,
        `/contracts/${contract.id}`
      );

      return contract;
    });
  }

  static async updateMilestoneSchedule(clientId, contractId, milestoneId, data) {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract) throw ApiError.notFound('Contract not found');
    if (contract.clientId !== clientId) throw ApiError.forbidden('Unauthorized: not contract owner');
    if (contract.status !== 'PENDING_FUNDING' && contract.status !== 'DRAFT') {
      throw ApiError.badRequest('Cannot adjust milestones on active or funded contracts');
    }

    const milestone = await prisma.milestone.findUnique({ where: { id: milestoneId } });
    if (!milestone || milestone.contractId !== contractId) {
      throw ApiError.notFound('Milestone not found in this contract');
    }

    if (milestone.status !== 'PENDING_FUNDING') {
      throw ApiError.badRequest('Cannot modify already funded milestone');
    }

    return prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
    });
  }

  static async deleteMilestone(clientId, contractId, milestoneId) {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: { milestones: true },
    });

    if (!contract) throw ApiError.notFound('Contract not found');
    if (contract.clientId !== clientId) throw ApiError.forbidden('Unauthorized: not contract owner');
    if (contract.status !== 'PENDING_FUNDING') {
      throw ApiError.badRequest('Cannot delete milestones from active contract');
    }

    if (contract.milestones.length <= 1) {
      throw ApiError.badRequest('Contract must contain at least one milestone');
    }

    const milestone = contract.milestones.find((m) => m.id === milestoneId);
    if (!milestone) throw ApiError.notFound('Milestone not found');
    if (milestone.status !== 'PENDING_FUNDING') {
      throw ApiError.badRequest('Cannot delete funded milestone');
    }

    return prisma.milestone.delete({ where: { id: milestoneId } });
  }

  static async cancelContract(userId, contractId) {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: { job: true },
    });

    if (!contract) throw ApiError.notFound('Contract not found');
    if (contract.clientId !== userId && contract.artisanId !== userId) {
      throw ApiError.forbidden('Unauthorized to cancel this contract');
    }
    if (contract.status !== 'PENDING_FUNDING') {
      throw ApiError.badRequest('Only unfunded contracts can be cancelled. Use dispute resolution for funded contracts.');
    }

    return prisma.$transaction(async (tx) => {
      const updatedContract = await tx.contract.update({
        where: { id: contractId },
        data: { status: 'CANCELLED' },
      });

      // Restore job status to OPEN
      await tx.job.update({
        where: { id: contract.jobId },
        data: { status: 'OPEN' },
      });

      const recipientId = userId === contract.clientId ? contract.artisanId : contract.clientId;
      await NotificationService.createNotification(
        recipientId,
        'Contract Cancelled',
        `Contract #${contract.contractCode} was cancelled prior to escrow funding.`,
        `/jobs/${contract.jobId}`
      );

      return updatedContract;
    });
  }

  static async getContractsForUser(userId, role) {
    const where = role === 'ARTISAN' ? { artisanId: userId } : { clientId: userId };

    return prisma.contract.findMany({
      where,
      include: {
        job: { select: { id: true, title: true, category: true } },
        milestones: { orderBy: { stepOrder: 'asc' } },
        artisan: { select: { id: true, email: true, artisanProfile: true, avatarUrl: true } },
        client: { select: { id: true, email: true, clientProfile: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getContractById(userId, contractId) {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        job: true,
        milestones: { orderBy: { stepOrder: 'asc' } },
        artisan: { select: { id: true, email: true, artisanProfile: true, avatarUrl: true } },
        client: { select: { id: true, email: true, clientProfile: true, avatarUrl: true } },
        disputes: true,
        reviews: true,
      },
    });

    if (!contract) throw ApiError.notFound('Contract not found');
    if (contract.clientId !== userId && contract.artisanId !== userId) {
      throw ApiError.forbidden('Unauthorized access to contract');
    }

    return contract;
  }
}

export default ContractService;
