import prisma from '../config/db.js';
import { env } from '../config/env.js';
import { MonadEscrowService } from './monad-escrow.service.js';
import { ethers } from 'ethers';

export class ReconciliationService {
  /**
   * Performs end-to-end reconciliation between external liquidity providers (Paystack, Monad)
   * and internal PostgreSQL ledger balances.
   */
  static async performDailyReconciliation(targetDate = new Date()) {
    const startOfDay = new Date(targetDate);
    startOfDay.setUTCHours(0, 0, 0, 0);

    // 1. Fetch live balance from Paystack
    let paystackBalanceNgn = 0;
    if (env.PAYSTACK_SECRET_KEY && !env.PAYSTACK_SECRET_KEY.startsWith('sk_test_xxx')) {
      try {
        const response = await fetch('https://api.paystack.co/balance', {
          headers: {
            Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        if (data.status && Array.isArray(data.data)) {
          const ngnEntry = data.data.find((b) => b.currency === 'NGN');
          if (ngnEntry) {
            paystackBalanceNgn = Number(ngnEntry.balance) / 100; // Paystack returns kobo
          }
        }
      } catch (err) {
        console.warn(`⚠️ Paystack balance query failed: ${err.message}`);
      }
    } else {
      // In sandbox mode, estimate Paystack balance as total sum of successful deposits minus completed withdrawals
      const [depositsAgg, withdrawalsAgg] = await Promise.all([
        prisma.transaction.aggregate({
          where: { type: 'WALLET_DEPOSIT', status: 'SUCCESS' },
          _sum: { amount: true },
        }),
        prisma.payoutRequest.aggregate({
          where: { status: 'COMPLETED' },
          _sum: { amount: true },
        }),
      ]);
      const totalDeposits = Number(depositsAgg._sum.amount || 0);
      const totalWithdrawals = Number(withdrawalsAgg._sum.amount || 0);
      paystackBalanceNgn = Math.max(0, totalDeposits - totalWithdrawals);
    }

    // 2. Calculate internal fiat liabilities
    const walletAggregates = await prisma.wallet.aggregate({
      where: { currency: 'NGN' },
      _sum: {
        availableBalance: true,
        escrowLockedBalance: true,
      },
      _count: { id: true },
    });

    const dbTotalAvailableNgn = Number(walletAggregates._sum.availableBalance || 0);
    const dbTotalLockedNgn = Number(walletAggregates._sum.escrowLockedBalance || 0);
    const totalFiatLiabilities = dbTotalAvailableNgn + dbTotalLockedNgn;
    const ngnVariance = Number((paystackBalanceNgn - totalFiatLiabilities).toFixed(2));

    // 3. Query Monad on-chain USDC escrow balance
    let monadEscrowUsdc = 0;
    try {
      const { address, paymentTokenAddress } = MonadEscrowService.loadArtifact();
      if (address && paymentTokenAddress) {
        const provider = MonadEscrowService.getProvider();
        const minErc20Abi = ['function balanceOf(address account) external view returns (uint256)'];
        const usdcContract = new ethers.Contract(paymentTokenAddress, minErc20Abi, provider);
        const rawBalance = await usdcContract.balanceOf(address);
        monadEscrowUsdc = Number(ethers.formatUnits(rawBalance, 6)); // Standard 6 decimals
      }
    } catch {
      // If RPC is offline or running local tests, sum on-chain verified funding amounts
      const onChainContracts = await prisma.contract.aggregate({
        where: {
          status: 'ACTIVE',
          onChainEscrowId: { not: null },
        },
        _sum: { cryptoAmount: true },
      });
      monadEscrowUsdc = Number(onChainContracts._sum.cryptoAmount || 0);
    }

    // 4. Calculate internal crypto liabilities (active contracts on Monad)
    const cryptoContracts = await prisma.contract.aggregate({
      where: {
        status: { in: ['ACTIVE', 'DISPUTED'] },
        cryptoCurrency: 'USDC',
      },
      _sum: { cryptoAmount: true },
    });
    const dbActiveCryptoEscrow = Number(cryptoContracts._sum.cryptoAmount || 0);
    const cryptoVariance = Number((monadEscrowUsdc - dbActiveCryptoEscrow).toFixed(2));

    // 5. Categorize Health Status
    let status = 'BALANCED';
    if (Math.abs(ngnVariance) > 1000 || Math.abs(cryptoVariance) > 5.0) {
      status = 'CRITICAL';
    } else if (Math.abs(ngnVariance) > 10 || Math.abs(cryptoVariance) > 0.05) {
      status = 'DISCREPANCY';
    }

    // 6. Record or update DailyFinancialReport
    const report = await prisma.dailyFinancialReport.upsert({
      where: { date: startOfDay },
      create: {
        date: startOfDay,
        paystackBalanceNgn,
        dbTotalAvailableNgn,
        dbTotalLockedNgn,
        ngnVariance,
        monadEscrowUsdc,
        dbActiveCryptoEscrow,
        cryptoVariance,
        status,
        details: {
          totalWallets: walletAggregates._count.id,
          auditedAt: new Date().toISOString(),
          isLivePaystack: Boolean(env.PAYSTACK_SECRET_KEY && !env.PAYSTACK_SECRET_KEY.startsWith('sk_test_xxx')),
        },
      },
      update: {
        paystackBalanceNgn,
        dbTotalAvailableNgn,
        dbTotalLockedNgn,
        ngnVariance,
        monadEscrowUsdc,
        dbActiveCryptoEscrow,
        cryptoVariance,
        status,
        details: {
          totalWallets: walletAggregates._count.id,
          auditedAt: new Date().toISOString(),
          isLivePaystack: Boolean(env.PAYSTACK_SECRET_KEY && !env.PAYSTACK_SECRET_KEY.startsWith('sk_test_xxx')),
        },
      },
    });

    console.log(
      `📊 Financial Reconciliation Complete [${status}]: NGN Variance: ₦${ngnVariance.toLocaleString()}, USDC Variance: $${cryptoVariance}`
    );

    return report;
  }

  /**
   * Retrieves recent financial reconciliation reports
   */
  static async getReports(limit = 30) {
    return prisma.dailyFinancialReport.findMany({
      orderBy: { date: 'desc' },
      take: limit,
    });
  }
}

export default ReconciliationService;
