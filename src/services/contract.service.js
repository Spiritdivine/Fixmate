import prisma from '../config/db.js';
import { ApiError } from '../utils/api-error.js';
import { env } from '../config/env.js';
import { NotificationService } from './notification.service.js';
import { NavigationUtils } from '../utils/navigation.utils.js';
import { JobEventDispatcher } from '../events/job.events.js';

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

    const createdContract = await prisma.$transaction(async (tx) => {
      // 0. Pessimistic row-level lock on Job to serialize concurrent proposal acceptances
      const lockedJobs = await tx.$queryRaw`
        SELECT id, status FROM jobs WHERE id = ${proposal.jobId}::uuid FOR UPDATE
      `;
      const lockedJob = lockedJobs && lockedJobs[0];
      if (!lockedJob || lockedJob.status !== 'OPEN') {
        throw ApiError.badRequest('Job is no longer open for proposal acceptance');
      }

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

    // Real-Time Domain Event Emission to Both Parties
    JobEventDispatcher.onContractCreated(clientId, proposal.artisanId, createdContract, proposal.job);

    return createdContract;
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
        artisan: { select: { id: true, email: true, phoneNumber: true, artisanProfile: true, avatarUrl: true } },
        client: { select: { id: true, email: true, phoneNumber: true, clientProfile: true, avatarUrl: true } },
        disputes: true,
        reviews: true,
      },
    });

    if (!contract) throw ApiError.notFound('Contract not found');
    if (contract.clientId !== userId && contract.artisanId !== userId) {
      throw ApiError.forbidden('Unauthorized access to contract');
    }

    const isFunded = contract.status === 'IN_PROGRESS' || contract.status === 'COMPLETED';
    const artisanProfile = contract.artisan?.artisanProfile;

    // Attach verified navigation deep links for funded escrow engagements
    if (isFunded && artisanProfile?.latitude && artisanProfile?.longitude) {
      contract.navigationSuite = NavigationUtils.getNavigationSuite(
        artisanProfile.latitude,
        artisanProfile.longitude,
        artisanProfile.businessName || 'Artisan Workshop'
      );
      contract.isLocationRevealed = true;
    } else {
      contract.isLocationRevealed = false;
    }

    return contract;
  }

  static async createChangeOrder(artisanId, contractId, data) {
    const { additionalAmount = 0, additionalDays = 0, reason, evidencePhotos = [] } = data;

    return prisma.$transaction(async (tx) => {
      const contract = await tx.contract.findUnique({
        where: { id: contractId },
        include: {
          client: { select: { id: true, email: true } },
        },
      });

      if (!contract) throw ApiError.notFound('Contract not found');
      if (contract.artisanId !== artisanId) {
        throw ApiError.forbidden('Only the assigned artisan can request a change order');
      }
      if (contract.status === 'COMPLETED' || contract.status === 'CANCELLED' || contract.status === 'REFUNDED') {
        throw ApiError.badRequest('Cannot request a change order on a finalized or cancelled contract');
      }

      // Check if there is an existing pending change order with lock to prevent race conditions
      const existingPending = await tx.$queryRaw`
        SELECT id FROM contract_change_orders
        WHERE contract_id = ${contractId}::uuid AND status = 'PENDING'
        FOR UPDATE
      `;

      if (existingPending && existingPending.length > 0) {
        throw ApiError.badRequest('A change order is already pending review for this contract');
      }

      const changeOrder = await tx.contractChangeOrder.create({
        data: {
          contractId,
          artisanId,
          additionalAmount,
          additionalDays,
          reason,
          evidencePhotos,
          status: 'PENDING',
        },
      });

      await NotificationService.createNotification(
        contract.clientId,
        'Change Order Requested 📝',
        `Artisan requested a contract amendment: +₦${Number(additionalAmount).toLocaleString()} / +${additionalDays} days. Reason: ${reason.substring(0, 60)}...`,
        `/contracts/${contractId}`
      );

      return changeOrder;
    });
  }

  static async getChangeOrders(userId, contractId) {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract) throw ApiError.notFound('Contract not found');
    if (contract.clientId !== userId && contract.artisanId !== userId) {
      throw ApiError.forbidden('Unauthorized access to contract change orders');
    }

    return prisma.contractChangeOrder.findMany({
      where: { contractId },
      include: {
        artisan: {
          select: {
            id: true,
            email: true,
            avatarUrl: true,
            artisanProfile: { select: { businessName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async respondToChangeOrder(clientId, contractId, changeOrderId, { action, reason }) {
    return prisma.$transaction(async (tx) => {
      // 0. Pessimistic row-level lock on the change order to serialize concurrent responses
      const lockedChangeOrders = await tx.$queryRaw`
        SELECT id, contract_id, artisan_id, status, additional_amount, additional_days, reason
        FROM contract_change_orders
        WHERE id = ${changeOrderId}::uuid FOR UPDATE
      `;
      const changeOrder = lockedChangeOrders && lockedChangeOrders[0];

      if (!changeOrder || changeOrder.contract_id !== contractId) {
        throw ApiError.notFound('Change order not found for this contract');
      }

      if (changeOrder.status !== 'PENDING') {
        throw ApiError.badRequest(`Change order has already been resolved (${changeOrder.status})`);
      }

      const contract = await tx.contract.findUnique({
        where: { id: contractId },
        include: {
          milestones: { orderBy: { stepOrder: 'asc' } },
        },
      });

      if (!contract) throw ApiError.notFound('Contract not found');
      if (contract.clientId !== clientId) {
        throw ApiError.forbidden('Only the contract client can approve or reject change orders');
      }

      if (action === 'REJECT') {
        const updatedChangeOrder = await tx.contractChangeOrder.update({
          where: { id: changeOrderId },
          data: {
            status: 'REJECTED',
            clientResponseReason: reason || null,
            resolvedAt: new Date(),
          },
        });

        await NotificationService.createNotification(
          contract.artisanId,
          'Change Order Rejected ❌',
          `Your change order request for Contract #${contract.contractCode} was declined.${reason ? ` Reason: ${reason}` : ''}`,
          `/contracts/${contractId}`
        );

        return updatedChangeOrder;
      }

      // APPROVE flow
      const updatedChangeOrder = await tx.contractChangeOrder.update({
        where: { id: changeOrderId },
        data: {
          status: 'APPROVED',
          clientResponseReason: reason || null,
          resolvedAt: new Date(),
        },
      });

      const additionalAmountNum = Number(changeOrder.additional_amount);

      // Increment contract total amount
      await tx.contract.update({
        where: { id: contractId },
        data: {
          totalAmount: { increment: additionalAmountNum },
        },
      });

      // If additional funding requested, create an amendment milestone
      if (additionalAmountNum > 0) {
        const maxStep = contract.milestones.reduce((max, m) => Math.max(max, m.stepOrder), 0);
        await tx.milestone.create({
          data: {
            contractId,
            stepOrder: maxStep + 1,
            title: `Change Order Amendment: ${changeOrder.reason.substring(0, 40)}`,
            description: changeOrder.reason,
            amount: additionalAmountNum,
            status: 'PENDING_FUNDING',
          },
        });
      }

      await NotificationService.createNotification(
        contract.artisanId,
        'Change Order Approved ✅',
        `Your change order for Contract #${contract.contractCode} has been approved (+₦${additionalAmountNum.toLocaleString()}).`,
        `/contracts/${contractId}`
      );

      return updatedChangeOrder;
    });
  }
}

export default ContractService;
