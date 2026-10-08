import prisma from '../config/db.js';
import { ApiError } from '../utils/api-error.js';
import { env } from '../config/env.js';
import { MatchingEngineService } from './matching-engine.service.js';
import { NotificationService } from './notification.service.js';

export class AiEscrowService {
  /**
   * Calculate automated milestone split (Materials advance + Labor upon completion)
   * and dual-rail fiat (NGN) and Web3 (Monad USDC) amounts.
   * @param {Object} params
   * @param {string} params.sessionId
   */
  static async calculateEscrowPlan({ sessionId }) {
    const session = await prisma.aiDiagnosticSession.findUnique({
      where: { id: sessionId },
      include: { category: true },
    });

    if (!session) {
      throw ApiError.notFound('Diagnostic session not found');
    }

    // 1. Calculate Materials Advance (Milestone 1) from estimated BOM
    let materialsAdvanceNgn = 0;
    const bomItems = Array.isArray(session.estimatedBOM) ? session.estimatedBOM : [];
    if (bomItems.length > 0) {
      materialsAdvanceNgn = bomItems.reduce((acc, item) => {
        const min = Number(item.estimatedCostMin) || 0;
        const max = Number(item.estimatedCostMax) || min;
        return acc + Math.round((min + max) / 2);
      }, 0);
    }

    // 2. Calculate Labor Upon Completion (Milestone 2) from estimated Labor range
    const laborMin = Number(session.estimatedLaborMin) || 5000;
    const laborMax = Number(session.estimatedLaborMax) || laborMin;
    const laborAmountNgn = Math.round((laborMin + laborMax) / 2);

    const totalNgn = materialsAdvanceNgn + laborAmountNgn;
    const platformFeePercent = parseFloat(env.ESCROW_FEE_PERCENT || '5.00');
    const platformFeeNgn = Math.round((totalNgn * platformFeePercent) / 100);

    // 3. Web3 Monad USDC exchange calculation (Default: 1 USDC = 1,500 NGN)
    const ngnPerUsdc = Number(process.env.NGN_PER_USDC || 1500);
    const materialsAdvanceUsdc = Number((materialsAdvanceNgn / ngnPerUsdc).toFixed(2));
    const laborAmountUsdc = Number((laborAmountNgn / ngnPerUsdc).toFixed(2));
    const totalUsdc = Number((totalNgn / ngnPerUsdc).toFixed(2));
    const platformFeeUsdc = Number((platformFeeNgn / ngnPerUsdc).toFixed(2));

    const milestones = [];

    if (materialsAdvanceNgn > 0) {
      const matPercentage = Math.round((materialsAdvanceNgn / (totalNgn || 1)) * 100);
      milestones.push({
        order: 1,
        stepOrder: 1,
        title: 'Milestone 1: Materials & Parts Advance',
        description: `Advance for verified diagnostic Bill of Materials: ${bomItems.map((b) => b.item).join(', ')}. Requires check-in or procurement proof.`,
        releaseCondition: 'Disbursed upon merchant procurement invoice & photo receipt upload.',
        amountNgn: materialsAdvanceNgn,
        amountUsdc: materialsAdvanceUsdc,
        amountCryptoUsdc: materialsAdvanceUsdc,
        percentage: matPercentage,
        type: 'MATERIALS',
      });
    }

    const laborPercentage = 100 - (materialsAdvanceNgn > 0 ? Math.round((materialsAdvanceNgn / (totalNgn || 1)) * 100) : 0);
    milestones.push({
      order: milestones.length + 1,
      stepOrder: milestones.length + 1,
      title: `Milestone ${milestones.length + 1}: Final Labor & Workmanship Release`,
      description: `Labor payout released upon client approval and AI Before/After photo inspection.`,
      releaseCondition: 'Released upon AI photo verification (zero leaks/hazards) and client signature.',
      amountNgn: laborAmountNgn,
      amountUsdc: laborAmountUsdc,
      amountCryptoUsdc: laborAmountUsdc,
      percentage: laborPercentage,
      type: 'LABOR',
    });

    return {
      sessionId,
      diagnosticTitle: session.diagnosticTitle,
      totalEstimatedNgn: totalNgn,
      totalEstimatedCryptoUsdc: totalUsdc,
      exchangeRateNgnUsdc: ngnPerUsdc,
      pricingSummary: {
        totalNgn,
        platformFeeNgn,
        netTotalNgn: totalNgn + platformFeeNgn,
        totalUsdc,
        platformFeeUsdc,
        netTotalUsdc: Number((totalUsdc + platformFeeUsdc).toFixed(2)),
        exchangeRate: `1 USDC = ₦${ngnPerUsdc.toLocaleString()}`,
      },
      milestones,
      supportedRails: [
        {
          rail: 'MONAD_BLOCKCHAIN',
          currency: 'USDC',
          network: 'Monad Testnet',
          depositMode: 'SMART_CONTRACT_ESCROW',
        },
        {
          rail: 'PAYSTACK_FIAT',
          currency: 'NGN',
          depositMode: 'DEDICATED_VIRTUAL_ACCOUNT_OR_CARD',
        },
      ],
    };
  }

  /**
   * Instantiate an active Contract and Milestones directly from the diagnostic session
   * @param {Object} params
   * @param {string} params.sessionId
   * @param {string} params.clientId
   * @param {string} params.artisanProfileId
   * @param {string} [params.customNotes]
   */
  static async createEscrowContractFromDiagnosis({
    sessionId,
    clientId,
    artisanProfileId,
    customNotes = '',
  }) {
    const session = await prisma.aiDiagnosticSession.findUnique({
      where: { id: sessionId },
      include: { mediaFiles: true },
    });

    if (!session) {
      throw ApiError.notFound('Diagnostic session not found');
    }

    const artisan = await prisma.artisanProfile.findUnique({
      where: { id: artisanProfileId },
      include: { user: true },
    });

    if (!artisan || !artisan.user) {
      throw ApiError.notFound('Selected artisan profile not found');
    }

    // Calculate escrow plan milestones
    const plan = await this.calculateEscrowPlan({ sessionId });
    const totalAmount = plan.pricingSummary.totalNgn;
    const platformFeePercent = parseFloat(env.ESCROW_FEE_PERCENT || '5.00');
    const platformFeeAmount = plan.pricingSummary.platformFeeNgn;

    // 1. Ensure Job is created
    let jobId = session.convertedToJobId;
    if (!jobId) {
      const conversion = await MatchingEngineService.convertDiagnosisToJob({
        sessionId,
        userId: clientId,
        preferredArtisanId: artisanProfileId,
        customNotes,
      });
      jobId = conversion.job.id;
    }

    const contractCode = `CTR-AI-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    return prisma.$transaction(async (tx) => {
      // 2. Ensure an accepted Proposal exists for the artisan on this job
      let proposal = await tx.proposal.findFirst({
        where: { jobId, artisanId: artisan.userId },
      });

      if (!proposal) {
        proposal = await tx.proposal.create({
          data: {
            jobId,
            artisanId: artisan.userId,
            bidAmount: totalAmount,
            estimatedDays: 1,
            coverLetter: `Direct AI-negotiated proposal based on diagnostic report "${session.diagnosticTitle}".`,
            status: 'ACCEPTED',
          },
        });
      }

      // 3. Create Contract with connected relations
      const contract = await tx.contract.create({
        data: {
          contractCode,
          totalAmount,
          platformFeePercent,
          platformFeeAmount,
          status: 'PENDING_FUNDING',
          job: { connect: { id: jobId } },
          proposal: { connect: { id: proposal.id } },
          client: { connect: { id: clientId } },
          artisan: { connect: { id: artisan.userId } },
          milestones: {
            create: plan.milestones.map((m) => ({
              stepOrder: m.stepOrder,
              title: m.title,
              description: m.description,
              amount: m.amountNgn,
              status: 'PENDING_FUNDING',
            })),
          },
        },
        include: {
          milestones: { orderBy: { stepOrder: 'asc' } },
        },
      });

      // 3. Link back to AI session
      await tx.aiDiagnosticSession.update({
        where: { id: sessionId },
        data: {
          convertedToContractId: contract.id,
          selectedArtisanId: artisanProfileId,
        },
      });

      // 4. Create Conversation Channel
      await tx.conversation.create({
        data: {
          contractId: contract.id,
          participants: {
            create: [{ userId: clientId }, { userId: artisan.userId }],
          },
        },
      });

      // 5. Notify Artisan of Direct AI Escrow Offer
      await NotificationService.createNotification(
        artisan.userId,
        'Direct Job Offer with Escrow Plan',
        `A client created an AI-verified contract "${session.diagnosticTitle}" (₦${totalAmount.toLocaleString()}). Fund pending.`,
        `/contracts/${contract.id}`
      );

      return {
        contract,
        milestones: contract.milestones,
        escrowPlan: plan,
      };
    });
  }
}
