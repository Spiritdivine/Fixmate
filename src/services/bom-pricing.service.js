import prisma from '../config/db.js';

export class BomPricingService {
  /**
   * Adjust raw LLM BOM items using active regional price indices and volatility buffers
   * @param {Object} params
   * @param {Array} params.bomItems
   * @param {string} [params.state='Lagos']
   * @param {string} [params.city='Lagos']
   * @param {string} [params.tradeCategory='general']
   */
  static async adjustBomToMarket({
    bomItems = [],
    state = 'Lagos',
    city = 'Lagos',
    tradeCategory = 'general',
  }) {
    if (!Array.isArray(bomItems) || bomItems.length === 0) return [];

    let multiplier = 1.25; // Default 25% inflation adjustment over baseline
    try {
      const indexRecord = await prisma.regionalPriceIndex.findFirst({
        where: {
          state: { equals: state, mode: 'insensitive' },
        },
        orderBy: { updatedAt: 'desc' },
      });

      if (indexRecord?.indexMultiplier) {
        multiplier = Number(indexRecord.indexMultiplier);
      }
    } catch (err) {
      // Graceful fallback to default index multiplier
      console.warn('⚠️ Could not query regional price index, using default multiplier:', err.message);
    }

    const volatilityBuffer = 0.12; // 12% contingency buffer for sudden price shocks
    const now = new Date();

    // Query active verified PriceObservation records for locality
    let priceObservations = [];
    try {
      priceObservations = await prisma.priceObservation.findMany({
        where: {
          locality: { contains: state, mode: 'insensitive' },
          expiresAt: { gt: now },
        },
      });
    } catch (err) {
      console.warn('⚠️ Could not fetch price observations:', err.message);
    }

    return bomItems.map((item) => {
      const itemNameLower = (item.item || '').toLowerCase();

      // Attempt exact or keyword match in active PriceObservation records
      const matchedObs = priceObservations.find((obs) => {
        const obsDescLower = (obs.itemDescription || '').toLowerCase();
        const obsIdLower = (obs.itemId || '').toLowerCase();
        return (
          itemNameLower.includes(obsIdLower) ||
          obsDescLower.includes(itemNameLower) ||
          itemNameLower.includes(obsDescLower)
        );
      });

      if (matchedObs) {
        const obsMin = Number(matchedObs.minPriceNgn);
        const obsMax = Number(matchedObs.maxPriceNgn);
        const qty = Number(item.quantity) || 1;

        return {
          item: item.item,
          specification: item.specification || 'Standard trade grade',
          quantity: qty,
          unit: item.unit || 'PCS',
          estimatedCostMin: obsMin * qty,
          estimatedCostMax: obsMax * qty,
          marketCategory: item.marketCategory || 'GENERAL',
          isPriceIndexed: true,
          sourceType: matchedObs.sourceType,
          sourceReference: matchedObs.sourceReference,
          provenanceId: matchedObs.id,
          pricingDisclaimer: `Grounded in verified local merchant data (${matchedObs.sourceReference}). Subject to on-site merchant invoice.`,
        };
      }

      const min = Number(item.estimatedCostMin) || 0;
      const max = Number(item.estimatedCostMax) || min;

      const adjustedMin = Math.round(min * multiplier);
      const adjustedMax = Math.max(adjustedMin, Math.round(max * multiplier * (1 + volatilityBuffer)));

      return {
        item: item.item,
        specification: item.specification || 'Standard trade grade',
        quantity: item.quantity || 1,
        unit: item.unit || 'PCS',
        estimatedCostMin: adjustedMin,
        estimatedCostMax: adjustedMax,
        marketCategory: item.marketCategory || 'GENERAL',
        isPriceIndexed: true,
        indexFactorApplied: multiplier,
        pricingDisclaimer:
          'Indicative wholesale/retail band based on local market rates. Final price confirmed upon on-site merchant invoice.',
      };
    });
  }

  /**
   * Two-Stage Escrow Protocol: Evaluate variance between budgeted BOM milestone and artisan's physical merchant invoice
   * @param {Object} params
   * @param {string} params.milestoneId
   * @param {number} params.actualInvoiceAmountNgn
   */
  static async evaluateProcurementVariance({ milestoneId, actualInvoiceAmountNgn }) {
    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: { contract: true },
    });

    if (!milestone) {
      throw new Error('Milestone not found for variance evaluation.');
    }

    const budgetedAmount = Number(milestone.amountNgn) || 0;
    const difference = actualInvoiceAmountNgn - budgetedAmount;
    const percentageVariance = budgetedAmount > 0 ? (difference / budgetedAmount) * 100 : 0;

    if (difference <= 0) {
      return {
        status: 'AUTO_APPROVED',
        action: 'DISBURSE_WITHOUT_PENALTY',
        differenceNgn: difference,
        percentageVariance: Math.round(percentageVariance * 10) / 10,
        message: 'Invoice is within or under the budgeted milestone advance. Eligible for instant disbursement.',
      };
    }

    if (percentageVariance <= 15) {
      return {
        status: 'WITHIN_CONTINGENCY',
        action: 'CLIENT_NOTIFICATION_REQUIRED',
        differenceNgn: difference,
        percentageVariance: Math.round(percentageVariance * 10) / 10,
        message: `Invoice exceeds estimate by ${Math.round(percentageVariance)}% (within 15% platform contingency buffer). Client approval required.`,
      };
    }

    return {
      status: 'EXCEEDS_BUDGET',
      action: 'CONTRACT_AMENDMENT_REQUIRED',
      differenceNgn: difference,
      percentageVariance: Math.round(percentageVariance * 10) / 10,
      message: `Invoice exceeds estimate by ${Math.round(percentageVariance)}%. Exceeds safety buffer and requires mutual contract escrow amendment.`,
    };
  }
}
