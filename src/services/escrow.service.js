import prisma from '../config/db.js';
import { ApiError } from '../utils/api-error.js';
import { MonadEscrowService } from './monad-escrow.service.js';
import { NotificationService } from './notification.service.js';
import crypto from 'crypto';

/**
 * Escrow orchestration service adhering to SRP and managing database state,
 * wallet balance transitions, evidence tracking, and on-chain Monad synchronization.
 */
export class EscrowService {
  /**
   * Client funds milestone via Monad on-chain transaction or in-app wallet balance
   */
  static async fundMilestone(clientId, milestoneId, fundingData = {}) {
    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: { contract: true },
    });

    if (!milestone) throw ApiError.notFound('Milestone not found');
    if (milestone.contract.clientId !== clientId) throw ApiError.forbidden('Unauthorized');
    if (milestone.status !== 'PENDING_FUNDING') {
      throw ApiError.badRequest('Milestone has already been funded or is not in pending status');
    }

    const milestoneAmount = Number(milestone.amount);
    const { fundingTxHash, cryptoAmount, cryptoCurrency = 'MON' } = fundingData;

    // -------------------------------------------------------------
    // Path A: Monad On-Chain Escrow Funding (Web3 Verification)
    // -------------------------------------------------------------
    if (fundingTxHash) {
      const verifiedOnChain = await MonadEscrowService.verifyFundingTransaction(
        fundingTxHash,
        milestone.contract.contractCode
      );

      return prisma.$transaction(async (tx) => {
        // 1. Update Milestone status
        const updatedMilestone = await tx.milestone.update({
          where: { id: milestoneId },
          data: {
            status: 'FUNDED',
            fundedAt: new Date(),
          },
        });

        // 2. Update Contract with Monad blockchain verification data
        await tx.contract.update({
          where: { id: milestone.contractId },
          data: {
            status: 'ACTIVE',
            startedAt: milestone.contract.startedAt || new Date(),
            escrowFundedAmount: { increment: milestoneAmount },
            onChainEscrowId: verifiedOnChain.onChainEscrowId,
            smartContractAddr: MonadEscrowService.contractAddress,
            fundingTxHash: verifiedOnChain.txHash,
            cryptoAmount: cryptoAmount ? cryptoAmount : parseFloat(verifiedOnChain.amountMon),
            cryptoCurrency,
          },
        });

        // 3. Record Audit Transaction
        const ref = `ESC-MONAD-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
        const clientWallet = await tx.wallet.findUnique({ where: { userId: clientId } });
        if (clientWallet) {
          await tx.transaction.create({
            data: {
              walletId: clientWallet.id,
              contractId: milestone.contractId,
              milestoneId: milestone.id,
              reference: ref,
              paymentGatewayRef: verifiedOnChain.txHash,
              type: 'ESCROW_LOCK',
              amount: milestoneAmount,
              netAmount: -milestoneAmount,
              status: 'SUCCESS',
              balanceBefore: Number(clientWallet.availableBalance),
              balanceAfter: Number(clientWallet.availableBalance),
              description: `Monad On-Chain Escrow Lock (Escrow #${verifiedOnChain.onChainEscrowId}, Tx: ${verifiedOnChain.txHash.slice(0, 10)}...)`,
              metadata: { onChainEscrowId: verifiedOnChain.onChainEscrowId, txHash: verifiedOnChain.txHash },
            },
          });
        }

        await NotificationService.createNotification(
          milestone.contract.artisanId,
          'Milestone Funded (Monad Web3)',
          `Milestone "${milestone.title}" has been funded on-chain! You can begin work now.`,
          `/contracts/${milestone.contractId}`
        );

        return {
          ...updatedMilestone,
          blockchain: {
            network: 'Monad',
            onChainEscrowId: verifiedOnChain.onChainEscrowId,
            txHash: verifiedOnChain.txHash,
            amountMon: verifiedOnChain.amountMon,
          },
        };
      });
    }

    // -------------------------------------------------------------
    // Path B: In-App Wallet Atomic Lock (Web2 / Simulated Mode)
    // -------------------------------------------------------------
    return prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId: clientId } });
      if (!wallet) throw ApiError.notFound('Wallet not found');

      if (Number(wallet.availableBalance) < milestoneAmount) {
        throw ApiError.badRequest(
          `Insufficient available balance. Required: ₦${milestoneAmount.toLocaleString()}, Available: ₦${Number(wallet.availableBalance).toLocaleString()}`
        );
      }

      const balanceBefore = Number(wallet.availableBalance);
      const balanceAfter = balanceBefore - milestoneAmount;

      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          availableBalance: { decrement: milestoneAmount },
          escrowLockedBalance: { increment: milestoneAmount },
        },
      });

      const updatedMilestone = await tx.milestone.update({
        where: { id: milestoneId },
        data: {
          status: 'FUNDED',
          fundedAt: new Date(),
        },
      });

      await tx.contract.update({
        where: { id: milestone.contractId },
        data: {
          status: 'ACTIVE',
          startedAt: milestone.contract.startedAt || new Date(),
          escrowFundedAmount: { increment: milestoneAmount },
        },
      });

      const ref = `ESC-LOCK-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          contractId: milestone.contractId,
          milestoneId: milestone.id,
          reference: ref,
          type: 'ESCROW_LOCK',
          amount: milestoneAmount,
          netAmount: -milestoneAmount,
          status: 'SUCCESS',
          balanceBefore,
          balanceAfter,
          description: `Escrow Lock for Milestone: "${milestone.title}" (Contract ${milestone.contract.contractCode})`,
        },
      });

      await NotificationService.createNotification(
        milestone.contract.artisanId,
        'Milestone Funded',
        `Milestone "${milestone.title}" has been funded into escrow! You can begin work.`,
        `/contracts/${milestone.contractId}`
      );

      return updatedMilestone;
    });
  }

  /**
   * Artisan submits completed deliverable with Before & After evidence
   */
  static async submitMilestoneWork(
    artisanId,
    milestoneId,
    { submissionNotes, beforeProofUrls = [], submissionProofUrls = [] }
  ) {
    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: { contract: true },
    });

    if (!milestone) throw ApiError.notFound('Milestone not found');
    if (milestone.contract.artisanId !== artisanId) throw ApiError.forbidden('Unauthorized');
    if (milestone.status !== 'FUNDED' && milestone.status !== 'IN_PROGRESS') {
      throw ApiError.badRequest('Milestone cannot be submitted in its current status');
    }

    const updated = await prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
        submissionNotes,
        beforeProofUrls,
        submissionProofUrls,
      },
    });

    await NotificationService.createNotification(
      milestone.contract.clientId,
      'Deliverable Submitted for Review',
      `The artisan submitted work for "${milestone.title}". Please inspect proof and approve release.`,
      `/contracts/${milestone.contractId}`
    );

    return updated;
  }

  /**
   * Client requests revisions on submitted deliverable
   */
  static async requestMilestoneRevision(clientId, milestoneId, revisionNotes) {
    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: { contract: true },
    });

    if (!milestone) throw ApiError.notFound('Milestone not found');
    if (milestone.contract.clientId !== clientId) throw ApiError.forbidden('Unauthorized');
    if (milestone.status !== 'SUBMITTED') {
      throw ApiError.badRequest('Revisions can only be requested for submitted deliverables');
    }

    const updated = await prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        status: 'IN_PROGRESS',
        submissionNotes: `[REVISION REQUESTED]: ${revisionNotes}\n\n[PREVIOUS SUBMISSION]: ${milestone.submissionNotes || ''}`,
      },
    });

    await NotificationService.createNotification(
      milestone.contract.artisanId,
      'Revision Requested',
      `The client requested changes on "${milestone.title}": "${revisionNotes}"`,
      `/contracts/${milestone.contractId}`
    );

    return updated;
  }

  /**
   * Client approves submitted work and releases Escrow funds to Artisan
   */
  static async approveAndReleaseEscrow(clientId, milestoneId, releaseData = {}) {
    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: { contract: true },
    });

    if (!milestone) throw ApiError.notFound('Milestone not found');
    if (milestone.contract.clientId !== clientId) throw ApiError.forbidden('Unauthorized');
    if (milestone.status !== 'SUBMITTED' && milestone.status !== 'FUNDED') {
      throw ApiError.badRequest('Milestone deliverable is not submitted for approval');
    }

    const grossAmount = Number(milestone.amount);
    const feePercent = Number(milestone.contract.platformFeePercent);
    const feeAmount = Number(((grossAmount * feePercent) / 100).toFixed(2));
    const netPayout = grossAmount - feeAmount;
    const { releaseTxHash } = releaseData;

    return prisma.$transaction(async (tx) => {
      // 1. Client Wallet: Deduct from Escrow Locked Balance if locked in-app
      const clientWallet = await tx.wallet.findUnique({ where: { userId: clientId } });
      if (clientWallet && Number(clientWallet.escrowLockedBalance) >= grossAmount) {
        await tx.wallet.update({
          where: { id: clientWallet.id },
          data: {
            escrowLockedBalance: { decrement: grossAmount },
          },
        });
      }

      // 2. Artisan Wallet: Credit Net Payout to Available Balance
      const artisanWallet = await tx.wallet.findUnique({ where: { userId: milestone.contract.artisanId } });
      let artisanBefore = 0;
      let artisanAfter = 0;

      if (artisanWallet) {
        artisanBefore = Number(artisanWallet.availableBalance);
        artisanAfter = artisanBefore + netPayout;

        await tx.wallet.update({
          where: { id: artisanWallet.id },
          data: {
            availableBalance: { increment: netPayout },
          },
        });
      }

      // 3. Mark Milestone as RELEASED
      const updatedMilestone = await tx.milestone.update({
        where: { id: milestoneId },
        data: {
          status: 'RELEASED',
          approvedAt: new Date(),
          releasedAt: new Date(),
        },
      });

      // 4. Update Contract Released Totals & on-chain tx hash
      const contract = await tx.contract.update({
        where: { id: milestone.contractId },
        data: {
          escrowReleasedAmount: { increment: grossAmount },
          releaseTxHash: releaseTxHash || milestone.contract.releaseTxHash,
        },
        include: { milestones: true },
      });

      // If all milestones are RELEASED, mark contract COMPLETED
      const allCompleted = contract.milestones.every((m) => m.status === 'RELEASED');
      if (allCompleted) {
        await tx.contract.update({
          where: { id: contract.id },
          data: { status: 'COMPLETED', completedAt: new Date() },
        });

        await tx.job.update({
          where: { id: contract.jobId },
          data: { status: 'COMPLETED' },
        });

        await tx.artisanProfile.update({
          where: { userId: contract.artisanId },
          data: { completedJobsCount: { increment: 1 } },
        });
      }

      // 5. Financial Audit Transactions
      if (artisanWallet) {
        const releaseRef = `ESC-REL-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
        await tx.transaction.create({
          data: {
            walletId: artisanWallet.id,
            contractId: contract.id,
            milestoneId: milestone.id,
            reference: releaseRef,
            paymentGatewayRef: releaseTxHash || null,
            type: 'ESCROW_RELEASE',
            amount: grossAmount,
            fee: feeAmount,
            netAmount: netPayout,
            status: 'SUCCESS',
            balanceBefore: artisanBefore,
            balanceAfter: artisanAfter,
            description: `Escrow Payout for "${milestone.title}" (Platform fee ${feePercent}% deducted)`,
          },
        });
      }

      await NotificationService.createNotification(
        milestone.contract.artisanId,
        'Escrow Funds Released! 💰',
        `₦${netPayout.toLocaleString()} has been credited to your available balance for "${milestone.title}".`,
        `/wallets/my-wallet`
      );

      return {
        milestone: updatedMilestone,
        contractStatus: allCompleted ? 'COMPLETED' : 'ACTIVE',
        releaseTxHash: releaseTxHash || null,
        payoutSummary: {
          grossAmount,
          feeDeducted: feeAmount,
          netCredited: netPayout,
        },
      };
    });
  }

  /**
   * Artisan initiates voluntary refund of a funded milestone back to client
   */
  static async refundMilestoneToClient(artisanId, milestoneId, refundReason) {
    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: { contract: true },
    });

    if (!milestone) throw ApiError.notFound('Milestone not found');
    if (milestone.contract.artisanId !== artisanId) throw ApiError.forbidden('Unauthorized');
    if (milestone.status !== 'FUNDED' && milestone.status !== 'IN_PROGRESS' && milestone.status !== 'SUBMITTED') {
      throw ApiError.badRequest('Cannot refund milestone in current state');
    }

    const milestoneAmount = Number(milestone.amount);

    return prisma.$transaction(async (tx) => {
      // 1. Client Wallet: Unlock and restore to available balance
      const clientWallet = await tx.wallet.findUnique({ where: { userId: milestone.contract.clientId } });
      if (clientWallet) {
        const balanceBefore = Number(clientWallet.availableBalance);
        const balanceAfter = balanceBefore + milestoneAmount;

        await tx.wallet.update({
          where: { id: clientWallet.id },
          data: {
            availableBalance: { increment: milestoneAmount },
            escrowLockedBalance: { decrement: milestoneAmount },
          },
        });

        const refundRef = `ESC-REFUND-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
        await tx.transaction.create({
          data: {
            walletId: clientWallet.id,
            contractId: milestone.contractId,
            milestoneId: milestone.id,
            reference: refundRef,
            type: 'ESCROW_REFUND',
            amount: milestoneAmount,
            netAmount: milestoneAmount,
            status: 'SUCCESS',
            balanceBefore,
            balanceAfter,
            description: `Voluntary Refund by Artisan: "${refundReason}"`,
          },
        });
      }

      // 2. Mark milestone as CANCELLED
      const updatedMilestone = await tx.milestone.update({
        where: { id: milestoneId },
        data: {
          status: 'CANCELLED',
          submissionNotes: `[REFUNDED BY ARTISAN]: ${refundReason}`,
        },
      });

      // 3. Update contract refund totals
      const contract = await tx.contract.update({
        where: { id: milestone.contractId },
        data: {
          escrowRefundedAmount: { increment: milestoneAmount },
        },
        include: { milestones: true },
      });

      // If all milestones are finished (RELEASED or CANCELLED), mark contract COMPLETED
      const allFinished = contract.milestones.every(
        (m) => m.id === milestoneId || m.status === 'RELEASED' || m.status === 'CANCELLED'
      );
      if (allFinished) {
        await tx.contract.update({
          where: { id: contract.id },
          data: { status: 'COMPLETED', completedAt: new Date() },
        });

        await tx.job.update({
          where: { id: contract.jobId },
          data: { status: 'COMPLETED' },
        });

        await tx.artisanProfile.update({
          where: { userId: contract.artisanId },
          data: { completedJobsCount: { increment: 1 } },
        });
      }

      await NotificationService.createNotification(
        milestone.contract.clientId,
        'Milestone Refunded',
        `₦${milestoneAmount.toLocaleString()} was refunded to your available balance for "${milestone.title}". Reason: ${refundReason}`,
        `/wallets/my-wallet`
      );

      return updatedMilestone;
    });
  }

  /**
   * Reconcile Monad Blockchain state for contract
   */
  static async reconcileOnChainState(contractId) {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract) throw ApiError.notFound('Contract not found');
    if (!contract.onChainEscrowId) {
      return { message: 'Contract has no associated on-chain escrow ID', contract };
    }

    const onChainEscrow = await MonadEscrowService.getEscrow(contract.onChainEscrowId);

    return {
      contractId: contract.id,
      onChainEscrowId: contract.onChainEscrowId,
      onChainState: onChainEscrow,
      databaseStatus: contract.status,
    };
  }
}

export default EscrowService;
