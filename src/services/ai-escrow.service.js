import prisma from '../config/db.js';
import { ApiError } from '../utils/api-error.js';
import { env } from '../config/env.js';
import { FxOracleService } from './fx-oracle.service.js';
import { BomPricingService } from './bom-pricing.service.js';

export class AiEscrowService {
  /**
   * Calculate automated milestone split (Materials advance + Labor upon completion)
   * with dynamic FX oracle and regional inflation adjustments
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
    const rawBom = Array.isArray(session.estimatedBOM) ? session.estimatedBOM : [];

    // Adjust BOM through market pricing engine
    const adjustedBom = await BomPricingService.adjustBomToMarket({
      bomItems: rawBom,
      state: 'Lagos',
      city: 'Lagos',
      tradeCategory: session.category?.slug || 'general',
    });

    if (adjustedBom.length > 0) {
      materialsAdvanceNgn = adjustedBom.reduce((acc, item) => {
        const min = Number(item.estimatedCostMin) || 0;
        const max = Number(item.estimatedCostMax) || min;
        return acc + Math.round((min + max) / 2);
      }, 0);
    }

    // 2. Calculate Labor Upon Completion (Milestone 2) from estimated Labor range
    const laborMin = Number(session.estimatedLaborMin) || 6000;
    const laborMax = Number(session.estimatedLaborMax) || laborMin;
    const laborAmountNgn = Math.round((laborMin + laborMax) / 2);

    const totalNgn = materialsAdvanceNgn + laborAmountNgn;
    const platformFeePercent = parseFloat(env.ESCROW_FEE_PERCENT || '5.00');
    const platformFeeNgn = Math.round((totalNgn * platformFeePercent) / 100);

    // 3. Dynamic FX Oracle conversion for Monad USDC
    const fxRate = await FxOracleService.getNgnToUsdcRate();
    const materialsAdvanceUsdc = Number((materialsAdvanceNgn / fxRate).toFixed(2));
    const laborAmountUsdc = Number((laborAmountNgn / fxRate).toFixed(2));
    const totalUsdc = Number((totalNgn / fxRate).toFixed(2));
    const platformFeeUsdc = Number((platformFeeNgn / fxRate).toFixed(2));

    const milestones = [];

    if (materialsAdvanceNgn > 0) {
      const matPercentage = Math.round((materialsAdvanceNgn / (totalNgn || 1)) * 100);
      milestones.push({
        order: 1,
        stepOrder: 1,
        title: 'Milestone 1: Materials & Parts Procurement Advance',
        description: `Advance for verified diagnostic Bill of Materials: ${adjustedBom.map((b) => b.item).join(', ')}. Disbursed upon merchant pro-forma invoice and receipt upload.`,
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
      description: `Labor payout released upon client satisfaction and AI Before/After photo inspection.`,
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
      exchangeRateNgnUsdc: fxRate,
      pricingSummary: {
        totalNgn,
        platformFeeNgn,
        netTotalNgn: totalNgn + platformFeeNgn,
        totalUsdc,
        platformFeeUsdc,
        netTotalUsdc: Number((totalUsdc + platformFeeUsdc).toFixed(2)),
        exchangeRate: `1 USDC = ₦${fxRate.toLocaleString()}`,
      },
      milestones,
      supportedRails: [
        {
          rail: 'FIAT_NGN',
          name: 'Nigerian Naira (Bank Transfer / Card)',
          currency: 'NGN',
          total: totalNgn + platformFeeNgn,
        },
        {
          rail: 'CRYPTO_MONAD_USDC',
          name: 'Monad USDC Smart Escrow',
          currency: 'USDC',
          total: Number((totalUsdc + platformFeeUsdc).toFixed(2)),
        },
      ],
    };
  }

  /**
   * Instantiate an active contract in escrow from an AI diagnostic session
   */
  static async instantiateEscrowContract({
    sessionId,
    artisanId,
    clientId,
    paymentRail = 'FIAT_NGN',
  }) {
    const plan = await this.calculateEscrowPlan({ sessionId });
    const session = await prisma.aiDiagnosticSession.findUnique({
      where: { id: sessionId },
    });

    return prisma.$transaction(async (tx) => {
      const contract = await tx.contract.create({
        data: {
          clientId,
          artisanId,
          categoryId: session.matchedCategoryId,
          title: `Artifix Job: ${plan.diagnosticTitle || 'Maintenance Contract'}`,
          description: session.probableCause,
          totalAmountNgn: plan.pricingSummary.totalNgn,
          status: 'PENDING_FUNDING',
          paymentStatus: 'UNPAID',
          milestones: {
            create: plan.milestones.map((m) => ({
              stepOrder: m.stepOrder,
              title: m.title,
              description: m.description,
              amountNgn: m.amountNgn,
              releaseCondition: m.releaseCondition,
              status: 'PENDING',
            })),
          },
        },
        include: { milestones: true },
      });

      await tx.aiDiagnosticSession.update({
        where: { id: sessionId },
        data: {
          convertedToContractId: contract.id,
          selectedArtisanId: artisanId,
        },
      });

      return {
        contract,
        plan,
        paymentRail,
      };
    });
  }
}
