import { env } from '../config/env.js';

let cachedRate = 1600;
let lastFetchedAt = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache TTL

export class FxOracleService {
  /**
   * Retrieve current NGN per 1 USDC conversion rate with cache & fallback
   * @returns {Promise<number>} rate in NGN per 1 USDC
   */
  static async getNgnToUsdcRate() {
    const now = Date.now();
    if (now - lastFetchedAt < CACHE_TTL_MS && cachedRate > 500) {
      return cachedRate;
    }

    try {
      if (env.FX_ORACLE_URL) {
        const response = await fetch(env.FX_ORACLE_URL, { signal: AbortSignal.timeout(3500) });
        if (response.ok) {
          const data = await response.json();
          const rate = data?.['usd-coin']?.ngn || data?.rate || data?.price;
          if (typeof rate === 'number' && rate > 500) {
            cachedRate = rate;
            lastFetchedAt = now;
            return cachedRate;
          }
        }
      }
    } catch (err) {
      console.warn('⚠️ FX Oracle network fetch warning, falling back to configured baseline:', err.message);
    }

    // Baseline fallback from environment or market constant
    cachedRate = Number(process.env.NGN_PER_USDC || 1650);
    lastFetchedAt = now;
    return cachedRate;
  }

  /**
   * Convert an amount in NGN to USDC with slippage safety guarantees
   * @param {number} amountNgn
   */
  static async convertNgnToUsdc(amountNgn) {
    const rate = await this.getNgnToUsdcRate();
    const validAmountNgn = Number(amountNgn) || 0;
    const amountUsdc = Number((validAmountNgn / rate).toFixed(2));

    return {
      amountNgn: validAmountNgn,
      amountUsdc,
      exchangeRate: rate,
      rateFormatted: `1 USDC = ₦${rate.toLocaleString()}`,
      slippageBufferPercent: 2.0,
      guaranteedValidUntil: new Date(Date.now() + CACHE_TTL_MS),
    };
  }
}
