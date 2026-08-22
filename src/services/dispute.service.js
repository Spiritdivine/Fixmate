import prisma from '../config/db.js';
import { ApiError } from '../utils/api-error.js';
import { NotificationService } from './notification.service.js';

export class DisputeService {
  static async fileDispute(userId, data) {
    const { contractId, milestoneId, reason, explanation, evidences = [] } = data;

    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: { milestones: true },
    });

    if (!contract) throw ApiError.notFound('Contract not found');
    if (contract.clientId !== userId && contract.artisanId !== userId) {
      throw ApiError.forbidden('Unauthorized to file dispute on this contract');
    }

    let disputedAmount = Number(contract.totalAmount);
    if (milestoneId) {
      const milestone = contract.milestones.find((m) => m.id === milestoneId);
      if (milestone) disputedAmount = Number(milestone.amount);
    }

    const disputeCode = `DSP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    return prisma.$transaction(async (tx) => {
      // 1. Create dispute
      const dispute = await tx.dispute.create({
        data: {
          disputeCode,
          contractId,
          milestoneId,
          initiatedByUserId: userId,
          reason,
          explanation,
          disputedAmount,
          status: 'OPEN',
          evidences: evidences.length > 0
            ? {
                create: evidences.map((ev) => ({
                  uploaderId: userId,
                  title: ev.title,
                  fileUrl: ev.fileUrl,
                  mimeType: ev.mimeType || 'image/jpeg',
                })),
              }
            : undefined,
        },
      });

      // 2. Set Contract & Milestone status to DISPUTED
      await tx.contract.update({
        where: { id: contractId },
        data: { status: 'DISPUTED' },
      });

      if (milestoneId) {
        await tx.milestone.update({
          where: { id: milestoneId },
          data: { status: 'DISPUTED' },
        });
      }

      const opponentId = userId === contract.clientId ? contract.artisanId : contract.clientId;
      await NotificationService.createNotification(
        opponentId,
        'Dispute Filed',
        `A dispute was opened for Contract #${contract.contractCode}: "${reason}"`,
        `/contracts/${contract.id}`
      );

      return dispute;
    });
  }

  static async resolveDispute(adminId, disputeId, { resolution, refundToClientAmount = 0, payoutToArtisanAmount = 0, adminResolutionNotes, onChainResolutionTxHash = null }) {
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { contract: true },
    });

    if (!dispute) throw ApiError.notFound('Dispute not found');
    if (dispute.status === 'RESOLVED') throw ApiError.badRequest('Dispute is already resolved');

    return prisma.$transaction(async (tx) => {
      // 1. Execute monetary settlement
      if (resolution === 'FULL_REFUND_CLIENT' || refundToClientAmount > 0) {
        const clientWallet = await tx.wallet.findUnique({ where: { userId: dispute.contract.clientId } });
        if (clientWallet) {
          const refund = resolution === 'FULL_REFUND_CLIENT' ? Number(dispute.disputedAmount) : Number(refundToClientAmount);
          await tx.wallet.update({
            where: { id: clientWallet.id },
            data: {
              availableBalance: { increment: refund },
              escrowLockedBalance: { decrement: refund },
            },
          });
        }
      }

      if (resolution === 'FULL_PAYOUT_ARTISAN' || payoutToArtisanAmount > 0) {
        const artisanWallet = await tx.wallet.findUnique({ where: { userId: dispute.contract.artisanId } });
        if (artisanWallet) {
          const payout = resolution === 'FULL_PAYOUT_ARTISAN' ? Number(dispute.disputedAmount) : Number(payoutToArtisanAmount);
          await tx.wallet.update({
            where: { id: artisanWallet.id },
            data: {
              availableBalance: { increment: payout },
            },
          });
        }
      }

      // 2. Update Dispute with resolution details and on-chain hash
      const updatedDispute = await tx.dispute.update({
        where: { id: disputeId },
        data: {
          status: 'RESOLVED',
          resolution,
          refundToClientAmount,
          payoutToArtisanAmount,
          adminResolutionNotes,
          onChainResolutionTxHash,
          resolvedByAdminId: adminId,
          resolvedAt: new Date(),
        },
      });

      // 3. Mark contract resolved / completed
      await tx.contract.update({
        where: { id: dispute.contractId },
        data: { status: 'COMPLETED' },
      });

      await NotificationService.createNotification(
        dispute.contract.clientId,
        'Dispute Resolved',
        `Admin resolution for Dispute #${dispute.disputeCode}: ${resolution}`,
        `/contracts/${dispute.contractId}`
      );
      await NotificationService.createNotification(
        dispute.contract.artisanId,
        'Dispute Resolved',
        `Admin resolution for Dispute #${dispute.disputeCode}: ${resolution}`,
        `/contracts/${dispute.contractId}`
      );

      return updatedDispute;
    });
  }

  static async cancelDispute(userId, disputeId) {
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { contract: true },
    });

    if (!dispute) throw ApiError.notFound('Dispute not found');
    if (dispute.initiatedByUserId !== userId) {
      throw ApiError.forbidden('Only the dispute initiator can cancel/withdraw the dispute');
    }
    if (dispute.status === 'RESOLVED') {
      throw ApiError.badRequest('Cannot cancel an already resolved dispute');
    }

    return prisma.$transaction(async (tx) => {
      const updatedDispute = await tx.dispute.update({
        where: { id: disputeId },
        data: {
          status: 'CLOSED',
          resolution: 'CANCELLED',
        },
      });

      // Restore contract status back to ACTIVE
      await tx.contract.update({
        where: { id: dispute.contractId },
        data: { status: 'ACTIVE' },
      });

      if (dispute.milestoneId) {
        await tx.milestone.update({
          where: { id: dispute.milestoneId },
          data: { status: 'IN_PROGRESS' },
        });
      }

      return updatedDispute;
    });
  }

  /**
   * Dispute Messaging
   */
  static async getDisputeMessages(userId, disputeId) {
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { contract: true },
    });

    if (!dispute) throw ApiError.notFound('Dispute not found');
    if (dispute.contract.clientId !== userId && dispute.contract.artisanId !== userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPPORT')) {
        throw ApiError.forbidden('Unauthorized access to dispute');
      }
    }

    return prisma.disputeMessage.findMany({
      where: { disputeId },
      include: {
        sender: { select: { id: true, email: true, role: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  static async sendDisputeMessage(userId, disputeId, { body, attachmentUrls = [] }) {
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { contract: true },
    });

    if (!dispute) throw ApiError.notFound('Dispute not found');

    return prisma.disputeMessage.create({
      data: {
        disputeId,
        senderId: userId,
        body,
        attachmentUrls,
      },
      include: {
        sender: { select: { id: true, email: true, role: true, avatarUrl: true } },
      },
    });
  }

  /**
   * Dispute Evidence
   */
  static async addDisputeEvidence(userId, disputeId, data) {
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { contract: true },
    });

    if (!dispute) throw ApiError.notFound('Dispute not found');
    if (dispute.contract.clientId !== userId && dispute.contract.artisanId !== userId) {
      throw ApiError.forbidden('Unauthorized to upload evidence');
    }

    return prisma.disputeEvidence.create({
      data: {
        disputeId,
        uploaderId: userId,
        title: data.title,
        fileUrl: data.fileUrl,
        mimeType: data.mimeType || 'image/jpeg',
      },
    });
  }

  static async deleteDisputeEvidence(userId, evidenceId) {
    const evidence = await prisma.disputeEvidence.findUnique({
      where: { id: evidenceId },
    });

    if (!evidence || evidence.uploaderId !== userId) {
      throw ApiError.notFound('Evidence not found or unauthorized');
    }

    return prisma.disputeEvidence.delete({
      where: { id: evidenceId },
    });
  }

  static async getDisputesForContract(userId, contractId) {
    return prisma.dispute.findMany({
      where: { contractId },
      include: {
        evidences: true,
        messages: { include: { sender: { select: { id: true, email: true, role: true } } } },
      },
    });
  }
}

export default DisputeService;
