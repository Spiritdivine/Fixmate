import crypto from 'crypto';
import prisma from '../config/db.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/api-error.js';
import { NotificationService } from './notification.service.js';

/**
 * Service responsible for Kotani Pay on/off-ramp crypto-to-fiat transactions.
 * Supports both live production execution and sandbox/test simulation.
 */
export class KotaniService {
  static rateCache = null;
  static rateCacheExpiry = 0;

  /**
   * Retrieves live or cached exchange rate (USDC -> NGN)
   */
  static async getExchangeRate(fromCurrency = 'USDC', toCurrency = 'NGN') {
    const now = Date.now();
    if (this.rateCache && this.rateCacheExpiry > now) {
      return this.rateCache;
    }

    let rate = 1465.00; // Base market rate fallback
    let source = 'SANDBOX_ESTIMATE';

    if (env.KOTANI_API_KEY && !env.KOTANI_API_KEY.startsWith('kot_test_dummy')) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);

        const response = await fetch(
          `${env.KOTANI_BASE_URL}/rates?from=${fromCurrency}&to=${toCurrency}`,
          {
            headers: {
              'x-api-key': env.KOTANI_API_KEY,
              Accept: 'application/json',
            },
            signal: controller.signal,
          }
        );
        clearTimeout(timeout);

        if (response.ok) {
          const data = await response.json();
          if (data?.data?.rate) {
            rate = Number(data.data.rate);
            source = 'KOTANI_LIVE_API';
          }
        }
      } catch (err) {
        console.warn(`⚠️ Kotani rate query error, using fallback: ${err.message}`);
      }
    }

    const rateResult = {
      fromCurrency,
      toCurrency,
      rate,
      source,
      expiresInSeconds: 60,
      timestamp: new Date().toISOString(),
    };

    this.rateCache = rateResult;
    this.rateCacheExpiry = now + 60000;

    return rateResult;
  }

  /**
   * Initiates an off-ramp payout: converts artisan's USDC on Monad into NGN sent to Nigerian Bank
   */
  static async initiateOffRamp(userId, { amountUsdc, bankAccountId, onChainTxHash = null }) {
    if (!amountUsdc || Number(amountUsdc) <= 0) {
      throw ApiError.badRequest('Amount in USDC must be greater than 0');
    }

    const amountNum = Number(amountUsdc);
    if (amountNum < 2) {
      throw ApiError.badRequest('Minimum off-ramp amount is $2.00 USDC');
    }

    const [user, bankAccount] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: { wallet: true, artisanProfile: true },
      }),
      prisma.bankAccount.findUnique({
        where: { id: bankAccountId },
      }),
    ]);

    if (!user || !user.wallet) throw ApiError.notFound('User or wallet not found');
    if (!bankAccount || bankAccount.userId !== userId) {
      throw ApiError.notFound('Verified bank account not found or unauthorized');
    }

    // 1. Fetch live rate
    const { rate } = await this.getExchangeRate('USDC', 'NGN');
    const estimatedNgn = Number((amountNum * rate).toFixed(2));
    const reference = `KOT-OFF-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

    // 1b. Tiered KYC Daily Limits (Rolling 24 Hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const past24hPayouts = await prisma.payoutRequest.findMany({
      where: {
        userId,
        gateway: 'KOTANI',
        status: { in: ['PENDING', 'PROCESSING', 'COMPLETED'] },
        createdAt: { gte: twentyFourHoursAgo },
      },
      select: { amount: true, exchangeRate: true },
    });

    const totalUsdc24h = past24hPayouts.reduce((acc, p) => {
      const pRate = Number(p.exchangeRate) || rate;
      return acc + (Number(p.amount) / pRate);
    }, 0);

    const maxDailyUsdc = user.isKycVerified ? 1000 : 50;
    if (totalUsdc24h + amountNum > maxDailyUsdc) {
      if (!user.isKycVerified) {
        throw ApiError.badRequest(
          `Daily cash-out limit of $50.00 USDC exceeded (24h total: $${totalUsdc24h.toFixed(2)} USDC). Please complete KYC verification in your profile to unlock $1,000.00 daily limits.`
        );
      } else {
        throw ApiError.badRequest(
          `Daily cash-out limit of $1,000.00 USDC exceeded (24h total: $${totalUsdc24h.toFixed(2)} USDC). Please contact corporate support for Tier-3 enterprise limits.`
        );
      }
    }

    let gatewayTransferCode = null;
    let isInstantSimulation = false;

    // 2. Call Kotani Pay API if configured
    if (env.KOTANI_API_KEY && !env.KOTANI_API_KEY.startsWith('kot_test_dummy')) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const res = await fetch(`${env.KOTANI_BASE_URL}/payouts/bank`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': env.KOTANI_API_KEY,
          },
          body: JSON.stringify({
            reference,
            amount: estimatedNgn,
            crypto_amount: amountNum,
            source_currency: 'USDC',
            destination_currency: 'NGN',
            bank_code: bankAccount.bankCode,
            account_number: bankAccount.accountNumber,
            account_name: bankAccount.accountName,
            customer_name: user.artisanProfile?.fullName || bankAccount.accountName,
            network: 'MONAD',
            tx_hash: onChainTxHash || undefined,
            callback_url: `${env.CLIENT_URL}/api/v1/payments/webhooks/kotani`,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        const data = await res.json();
        if (res.ok && data?.data) {
          gatewayTransferCode = data.data.transfer_code || data.data.id || `KOT_${Date.now()}`;
        } else {
          console.warn('⚠️ Kotani API payout call failed:', data?.message || res.statusText);
        }
      } catch (err) {
        console.warn(`⚠️ Kotani API network error: ${err.message}`);
      }
    }

    // Sandbox fallback
    if (!gatewayTransferCode) {
      gatewayTransferCode = `KOT_SIM_${Date.now()}`;
      isInstantSimulation = true;
    }

    // 3. Atomically record PayoutRequest and Transaction
    return prisma.$transaction(async (tx) => {
      const payoutStatus = isInstantSimulation ? 'COMPLETED' : 'PENDING';

      const payout = await tx.payoutRequest.create({
        data: {
          userId,
          walletId: user.wallet.id,
          bankAccountId,
          amount: estimatedNgn,
          sourceCurrency: 'USDC',
          destinationCurrency: 'NGN',
          exchangeRate: rate,
          gateway: 'KOTANI',
          fee: 0.00,
          reference,
          gatewayTransferCode,
          status: payoutStatus,
          processedAt: payoutStatus === 'COMPLETED' ? new Date() : null,
        },
      });

      const balanceBefore = Number(user.wallet.availableBalance);

      await tx.transaction.create({
        data: {
          walletId: user.wallet.id,
          reference,
          paymentGatewayRef: gatewayTransferCode,
          type: 'PAYOUT_WITHDRAWAL',
          amount: estimatedNgn,
          netAmount: -estimatedNgn,
          status: payoutStatus === 'COMPLETED' ? 'SUCCESS' : 'PENDING',
          balanceBefore,
          balanceAfter: balanceBefore,
          description: `USDC Off-Ramp via Kotani Pay ($${amountNum.toFixed(2)} USDC -> ₦${estimatedNgn.toLocaleString()} to ${bankAccount.bankName})`,
          metadata: {
            gateway: 'KOTANI',
            amountUsdc: amountNum,
            exchangeRate: rate,
            onChainTxHash,
            bankAccount: `${bankAccount.bankName} - ${bankAccount.accountNumber}`,
          },
        },
      });

      await NotificationService.createNotification(
        userId,
        isInstantSimulation ? 'USDC Cash Out Completed ⚡' : 'USDC Cash Out Processing',
        `$${amountNum.toFixed(2)} USDC converted to ₦${estimatedNgn.toLocaleString()} for ${bankAccount.bankName} (${bankAccount.accountNumber}).`,
        '/wallets/my-wallet'
      );

      return {
        payout,
        estimatedNgn,
        amountUsdc: amountNum,
        exchangeRate: rate,
        status: payoutStatus,
        note: isInstantSimulation
          ? 'Sandbox test transfer completed instantly to your linked bank account.'
          : 'Transfer initiated with Kotani Pay banking network.',
      };
    });
  }

  /**
   * Initiates an on-ramp deposit: converts client's fiat NGN into USDC on Monad
   */
  static async initiateOnRamp(userId, { amountNgn, destinationWalletAddress = null }) {
    const amountNum = Number(amountNgn);
    if (!amountNum || amountNum < 1000) {
      throw ApiError.badRequest('Minimum on-ramp deposit amount is ₦1,000.00');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });

    if (!user || !user.wallet) throw ApiError.notFound('User or wallet not found');

    const targetAddress = destinationWalletAddress || user.walletAddress;
    if (!targetAddress) {
      throw ApiError.badRequest('Please provide or link a valid Monad EVM wallet address to receive USDC');
    }

    // 1. Fetch live rate
    const { rate } = await this.getExchangeRate('USDC', 'NGN');
    const estimatedUsdc = Number((amountNum / rate).toFixed(2));
    const reference = `KOT-ON-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

    let isLiveApi = Boolean(env.KOTANI_API_KEY && !env.KOTANI_API_KEY.startsWith('kot_test_dummy'));
    let checkoutUrl = null;
    let paymentInstructions = null;

    if (isLiveApi) {
      try {
        const response = await fetch(`${env.KOTANI_BASE_URL}/onramp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': env.KOTANI_API_KEY,
          },
          body: JSON.stringify({
            reference,
            amount: amountNum,
            sourceCurrency: 'NGN',
            targetCurrency: 'USDC',
            recipientAddress: targetAddress,
            network: 'MONAD',
            customerEmail: user.email,
          }),
        });

        if (response.ok) {
          const apiData = await response.json();
          checkoutUrl = apiData?.data?.checkout_url || apiData?.data?.payment_url;
          paymentInstructions = apiData?.data?.payment_instructions;
        }
      } catch (err) {
        console.warn(`⚠️ Kotani Live On-Ramp API error, falling back to sandbox simulation: ${err.message}`);
      }
    }

    // Record audit transaction
    await prisma.transaction.create({
      data: {
        walletId: user.wallet.id,
        reference,
        paymentGatewayRef: checkoutUrl || reference,
        type: 'WALLET_DEPOSIT',
        amount: amountNum,
        netAmount: amountNum,
        status: isLiveApi ? 'PENDING' : 'SUCCESS',
        balanceBefore: Number(user.wallet.availableBalance),
        balanceAfter: Number(user.wallet.availableBalance),
        description: `Kotani On-Ramp: ₦${amountNum.toLocaleString()} -> ~${estimatedUsdc} USDC (${targetAddress.slice(0, 6)}...${targetAddress.slice(-4)})`,
        metadata: {
          gateway: 'KOTANI',
          flow: 'ON_RAMP',
          sourceCurrency: 'NGN',
          targetCurrency: 'USDC',
          estimatedUsdc,
          exchangeRate: rate,
          targetAddress,
          checkoutUrl,
        },
      },
    });

    await NotificationService.createNotification(
      userId,
      'USDC On-Ramp Initiated 🚀',
      `Deposit of ₦${amountNum.toLocaleString()} for ~${estimatedUsdc} USDC initiated to wallet ${targetAddress.slice(0, 6)}...${targetAddress.slice(-4)}.`,
      '/wallets/my-wallet'
    );

    return {
      reference,
      amountNgn: amountNum,
      estimatedUsdc,
      exchangeRate: rate,
      destinationAddress: targetAddress,
      checkoutUrl: checkoutUrl || `https://sandbox.kotanipay.io/checkout/${reference}`,
      paymentInstructions: paymentInstructions || {
        bankName: 'Wema Bank (Kotani Virtual Sandbox)',
        accountNumber: '0981248921',
        accountName: `Fixmate - ${user.email}`,
      },
      status: isLiveApi ? 'PENDING' : 'SUCCESS',
      isSimulated: !isLiveApi,
    };
  }

  /**
   * Idempotent webhook handler with HMAC signature verification
   */
  static async handleWebhook(signature, rawBody, payload) {
    if (env.KOTANI_SECRET_KEY && !env.KOTANI_SECRET_KEY.startsWith('kot_sec_dummy')) {
      if (!signature) {
        throw ApiError.forbidden('Missing Kotani Pay webhook signature');
      }

      const bodyToHash = rawBody || JSON.stringify(payload);
      const hash = crypto
        .createHmac('sha256', env.KOTANI_SECRET_KEY)
        .update(bodyToHash)
        .digest('hex');

      if (hash !== signature && env.NODE_ENV === 'production') {
        throw ApiError.forbidden('Invalid Kotani Pay webhook signature');
      }
    }

    const { event, data } = payload;
    const eventId = data?.id?.toString() || data?.reference || `KOT_EVT_${Date.now()}`;

    // 1. Replay Window Protection (Reject events older than 5 minutes)
    const timestamp = payload?.timestamp || data?.timestamp || data?.created_at || payload?.createdAt;
    if (timestamp) {
      const eventTime = new Date(timestamp).getTime();
      if (!isNaN(eventTime)) {
        const ageInSeconds = Math.abs(Date.now() - eventTime) / 1000;
        if (ageInSeconds > 300 && env.NODE_ENV === 'production') {
          throw ApiError.badRequest('Webhook event expired (replay window exceeded: > 5 minutes)');
        }
      }
    }

    // 2. Check idempotency
    const existing = await prisma.webhookEvent.findUnique({
      where: { eventId },
    });

    if (existing && existing.isProcessed) {
      return { status: 'already_processed' };
    }

    await prisma.webhookEvent.upsert({
      where: { eventId },
      create: {
        eventId,
        gateway: 'KOTANI',
        eventType: event || 'kotani.event',
        payload,
      },
      update: {},
    });

    const reference = data?.reference;
    if (!reference) return { status: 'ignored_no_reference' };

    // Handle On-Ramp Events
    if (reference.startsWith('KOT-ON-')) {
      const tx = await prisma.transaction.findUnique({ where: { reference } });
      if (tx) {
        const isSuccess = event === 'onramp.success' || data?.status === 'SUCCESS' || data?.status === 'successful';
        await prisma.transaction.update({
          where: { reference },
          data: { status: isSuccess ? 'SUCCESS' : 'FAILED' },
        });

        await prisma.webhookEvent.update({
          where: { eventId },
          data: { isProcessed: true, processedAt: new Date() },
        });

        const wallet = await prisma.wallet.findUnique({ where: { id: tx.walletId } });
        if (wallet) {
          await NotificationService.createNotification(
            wallet.userId,
            isSuccess ? 'USDC On-Ramp Completed! ⚡' : 'USDC On-Ramp Failed',
            isSuccess
              ? `Your USDC on-ramp deposit of ₦${Number(tx.amount).toLocaleString()} has settled successfully.`
              : `Your USDC on-ramp deposit of ₦${Number(tx.amount).toLocaleString()} failed. Please try again.`,
            '/wallets/my-wallet'
          );
        }
      }
      return { status: 'success' };
    }

    const payout = await prisma.payoutRequest.findUnique({
      where: { reference },
    });

    if (!payout) return { status: 'payout_not_found' };

    // Process payout outcomes
    if (event === 'payout.success' || data?.status === 'SUCCESS' || data?.status === 'successful') {
      await prisma.$transaction(async (tx) => {
        await tx.payoutRequest.update({
          where: { reference },
          data: {
            status: 'COMPLETED',
            processedAt: new Date(),
          },
        });

        await tx.transaction.updateMany({
          where: { reference },
          data: { status: 'SUCCESS' },
        });

        await tx.webhookEvent.update({
          where: { eventId },
          data: { isProcessed: true, processedAt: new Date() },
        });
      });

      await NotificationService.createNotification(
        payout.userId,
        'Bank Payout Successful! 🏦',
        `Your withdrawal of ₦${Number(payout.amount).toLocaleString()} via Kotani Pay has arrived in your bank account.`,
        '/wallets/my-wallet'
      );
    } else if (event === 'payout.failed' || data?.status === 'FAILED') {
      await prisma.$transaction(async (tx) => {
        await tx.payoutRequest.update({
          where: { reference },
          data: {
            status: 'REJECTED',
            failureReason: data?.failure_reason || 'Kotani Pay transfer failed',
            processedAt: new Date(),
          },
        });

        await tx.transaction.updateMany({
          where: { reference },
          data: { status: 'FAILED' },
        });

        await tx.webhookEvent.update({
          where: { eventId },
          data: { isProcessed: true, processedAt: new Date() },
        });
      });

      await NotificationService.createNotification(
        payout.userId,
        'Bank Payout Failed',
        `Your withdrawal of ₦${Number(payout.amount).toLocaleString()} could not be processed. Reason: ${data?.failure_reason || 'Banking network error'}`,
        '/wallets/my-wallet'
      );
    }

    return { status: 'success' };
  }
}

export default KotaniService;
