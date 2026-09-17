import prisma from '../config/db.js';
import { ApiError } from '../utils/api-error.js';
import { NotificationService } from './notification.service.js';
import { MonadEscrowService } from './monad-escrow.service.js';
import { TreasuryService } from './treasury.service.js';
import crypto from 'crypto';

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

    let finalOnChainTxHash = onChainResolutionTxHash;

    // Execute automated settlement on Monad smart contract if on-chain escrow exists
    if (dispute.contract.onChainEscrowId && !finalOnChainTxHash) {
      try {
        const escrowId = dispute.contract.onChainEscrowId;
        const totalAmount = Number(dispute.contract.cryptoAmount || dispute.disputedAmount || 0);
        let artisanAmount = 0;
        let clientRefund = 0;

        if (resolution === 'FULL_REFUND_CLIENT') {
          clientRefund = totalAmount;
        } else if (resolution === 'FULL_PAYOUT_ARTISAN') {
          artisanAmount = totalAmount;
        } else if (resolution === 'SPLIT_SETTLEMENT') {
          artisanAmount = Number(payoutToArtisanAmount || 0);
          clientRefund = Number(refundToClientAmount || 0);
        }

        const onChainRes = await MonadEscrowService.executeAdminDisputeResolution(
          escrowId,
          artisanAmount,
          clientRefund
        );
        if (onChainRes && onChainRes.txHash) {
          finalOnChainTxHash = onChainRes.txHash;
        }
      } catch (onChainErr) {
        console.warn('⚠️ Could not execute automated on-chain dispute settlement:', onChainErr.message);
      }
    }

    const disputedTotal = Number(dispute.disputedAmount);
    let actualClientRefund = 0;
    let actualArtisanGross = 0;

    if (resolution === 'FULL_REFUND_CLIENT') {
      actualClientRefund = disputedTotal;
    } else if (resolution === 'FULL_PAYOUT_ARTISAN') {
      actualArtisanGross = disputedTotal;
    } else if (resolution === 'SPLIT_SETTLEMENT') {
      actualClientRefund = Number(refundToClientAmount || 0);
      actualArtisanGross = Number(payoutToArtisanAmount || 0);
    }

    const totalResolved = actualClientRefund + actualArtisanGross;
    const isOnChain = Boolean(
      dispute.contract.onChainEscrowId ||
      dispute.contract.cryptoCurrency === 'USDC' ||
      finalOnChainTxHash
    );

    return prisma.$transaction(async (tx) => {
      // 1. Pessimistic Row Lock on both Client and Artisan wallets
      const lockedWallets = await tx.$queryRaw`
        SELECT id, user_id, available_balance, escrow_locked_balance 
        FROM wallets 
        WHERE user_id IN (${dispute.contract.clientId}::uuid, ${dispute.contract.artisanId}::uuid)
        FOR UPDATE
      `;

      const clientWalletRow = lockedWallets?.find((w) => w.user_id === dispute.contract.clientId);
      const artisanWalletRow = lockedWallets?.find((w) => w.user_id === dispute.contract.artisanId);

      // 2. Client Wallet: Fully decrement escrowLockedBalance by total disputed funds
      if (clientWalletRow) {
        const clientAvailBefore = Number(clientWalletRow.available_balance);
        const clientLockedBefore = Number(clientWalletRow.escrow_locked_balance);
        const lockToDeduct = Math.min(clientLockedBefore, totalResolved > 0 ? totalResolved : disputedTotal);

        await tx.wallet.update({
          where: { id: clientWalletRow.id },
          data: {
            availableBalance: { increment: actualClientRefund },
            escrowLockedBalance: { decrement: lockToDeduct },
          },
        });

        if (actualClientRefund > 0) {
          const refundRef = `DSP-REF-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
          await tx.transaction.create({
            data: {
              walletId: clientWalletRow.id,
              contractId: dispute.contractId,
              reference: refundRef,
              type: 'ESCROW_REFUND',
              amount: actualClientRefund,
              netAmount: actualClientRefund,
              status: 'SUCCESS',
              balanceBefore: clientAvailBefore,
              balanceAfter: clientAvailBefore + actualClientRefund,
              description: `Dispute Resolution Refund (Dispute #${dispute.disputeCode})`,
              metadata: {
                disputeId: dispute.id,
                disputeCode: dispute.disputeCode,
                resolution,
              },
            },
          });
        }
      }

      // 3. Artisan Wallet: Credit net payout (less platform fee) if not on-chain
      let feeAmount = 0;
      let netArtisanPayout = 0;
      if (actualArtisanGross > 0) {
        const feePercent = Number(dispute.contract.platformFeePercent || 5);
        feeAmount = Number(((actualArtisanGross * feePercent) / 100).toFixed(2));
        netArtisanPayout = actualArtisanGross - feeAmount;

        if (artisanWalletRow) {
          const artisanAvailBefore = Number(artisanWalletRow.available_balance);
          const artisanAvailAfter = isOnChain ? artisanAvailBefore : artisanAvailBefore + netArtisanPayout;

          if (!isOnChain) {
            await tx.wallet.update({
              where: { id: artisanWalletRow.id },
              data: {
                availableBalance: { increment: netArtisanPayout },
              },
            });
          }

          const payoutRef = `DSP-PAY-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
          await tx.transaction.create({
            data: {
              walletId: artisanWalletRow.id,
              contractId: dispute.contractId,
              reference: payoutRef,
              paymentGatewayRef: finalOnChainTxHash || null,
              type: 'ESCROW_RELEASE',
              amount: actualArtisanGross,
              fee: feeAmount,
              netAmount: isOnChain ? 0 : netArtisanPayout,
              status: 'SUCCESS',
              balanceBefore: artisanAvailBefore,
              balanceAfter: artisanAvailAfter,
              description: isOnChain
                ? `Dispute Settlement Payout (#${dispute.disputeCode}) - Settled on Monad`
                : `Dispute Settlement Payout (#${dispute.disputeCode}) - Net after ${feePercent}% platform fee`,
              metadata: {
                disputeId: dispute.id,
                disputeCode: dispute.disputeCode,
                resolution,
                feeAmount,
                isOnChain,
              },
            },
          });

          // Record Fee in Treasury
          if (!isOnChain && feeAmount > 0) {
            await TreasuryService.recordFee(tx, {
              amount: feeAmount,
              contractId: dispute.contractId,
              reference: `FEE-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
              description: `Platform Fee (${feePercent}%) on Dispute Settlement (#${dispute.disputeCode})`,
              metadata: {
                disputeId: dispute.id,
                disputeCode: dispute.disputeCode,
                actualArtisanGross,
                feePercent,
              },
            });
          }
        }
      }

      // 4. Update Dispute with resolution details and on-chain hash
      const updatedDispute = await tx.dispute.update({
        where: { id: disputeId },
        data: {
          status: 'RESOLVED',
          resolution,
          refundToClientAmount: actualClientRefund,
          payoutToArtisanAmount: actualArtisanGross,
          adminResolutionNotes,
          onChainResolutionTxHash: finalOnChainTxHash,
          resolvedByAdminId: adminId,
          resolvedAt: new Date(),
        },
      });

      // 5. Mark contract resolved / completed
      await tx.contract.update({
        where: { id: dispute.contractId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          escrowRefundedAmount: { increment: actualClientRefund },
          escrowReleasedAmount: { increment: actualArtisanGross },
        },
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
