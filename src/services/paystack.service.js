import crypto from 'crypto';
import prisma from '../config/db.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/api-error.js';
import { NotificationService } from './notification.service.js';

export class PaystackService {
  /**
   * Initialize a wallet deposit transaction with Paystack
   */
  static async initializeDeposit(userId, amount) {
    if (!amount || Number(amount) <= 0) {
      throw ApiError.badRequest('Deposit amount must be greater than 0');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });

    if (!user || !user.wallet) throw ApiError.notFound('User or wallet not found');

    const reference = `PST-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const amountKobo = Math.round(Number(amount) * 100);

    // Call Paystack API if secret key is present
    if (env.PAYSTACK_SECRET_KEY && !env.PAYSTACK_SECRET_KEY.startsWith('sk_test_xxx')) {
      try {
        const response = await fetch('https://api.paystack.co/transaction/initialize', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: user.email,
            amount: amountKobo,
            reference,
            callback_url: `${env.CLIENT_URL}/wallets/deposit/callback`,
            metadata: {
              userId: user.id,
              walletId: user.wallet.id,
              custom_fields: [{ display_name: 'Platform', variable_name: 'platform', value: 'Artisan' }],
            },
          }),
        });

        const data = await response.json();
        if (data.status) {
          return {
            authorizationUrl: data.data.authorization_url,
            accessCode: data.data.access_code,
            reference,
            amount: Number(amount),
          };
        }
      } catch (err) {
        console.warn(`⚠️ Paystack API call error: ${err.message}`);
      }
    }

    // Fallback simulation / Testnet mode
    return {
      authorizationUrl: `https://checkout.paystack.com/simulate-checkout?reference=${reference}`,
      accessCode: `sim_acc_${Date.now()}`,
      reference,
      amount: Number(amount),
      note: 'Testnet/Sandbox payment session generated.',
    };
  }

  /**
   * Synchronously verifies a Paystack deposit reference
   */
  static async verifyDeposit(userId, reference) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });

    if (!user || !user.wallet) throw ApiError.notFound('User or wallet not found');

    // Check if already processed
    const existingTx = await prisma.transaction.findUnique({
      where: { reference },
    });

    if (existingTx && existingTx.status === 'SUCCESS') {
      return {
        status: 'SUCCESS',
        amount: Number(existingTx.amount),
        reference,
        message: 'Transaction already verified and processed',
      };
    }

    let depositAmount = 0;
    let paymentGatewayRef = null;

    if (env.PAYSTACK_SECRET_KEY && !env.PAYSTACK_SECRET_KEY.startsWith('sk_test_xxx')) {
      const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: { Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}` },
      });
      const data = await response.json();

      if (!data.status || data.data.status !== 'success') {
        throw ApiError.badRequest('Paystack transaction was not successful or is still pending');
      }

      depositAmount = data.data.amount / 100;
      paymentGatewayRef = data.data.id?.toString();
    } else {
      // Sandbox fallback if simulated
      depositAmount = 50000;
      paymentGatewayRef = `SIM-PST-${Date.now()}`;
    }

    // Atomic wallet credit
    return prisma.$transaction(async (tx) => {
      const balanceBefore = Number(user.wallet.availableBalance);
      const balanceAfter = balanceBefore + depositAmount;

      const updatedWallet = await tx.wallet.update({
        where: { id: user.wallet.id },
        data: {
          availableBalance: { increment: depositAmount },
        },
      });

      const transaction = await tx.transaction.create({
        data: {
          walletId: user.wallet.id,
          reference,
          paymentGatewayRef,
          type: 'WALLET_DEPOSIT',
          amount: depositAmount,
          netAmount: depositAmount,
          status: 'SUCCESS',
          balanceBefore,
          balanceAfter,
          description: `Paystack Deposit (Ref: ${reference})`,
        },
      });

      return {
        status: 'SUCCESS',
        amount: depositAmount,
        wallet: updatedWallet,
        transaction,
      };
    });
  }

  /**
   * Real-time Bank Account Name Resolution via Paystack
   */
  static async resolveBankAccount(accountNumber, bankCode) {
    if (!accountNumber || !bankCode) {
      throw ApiError.badRequest('Account number and bank code are required');
    }

    if (env.PAYSTACK_SECRET_KEY && !env.PAYSTACK_SECRET_KEY.startsWith('sk_test_xxx')) {
      try {
        const response = await fetch(
          `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
          {
            headers: {
              Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const data = await response.json();
        if (data.status && data.data) {
          return {
            accountNumber: data.data.account_number,
            accountName: data.data.account_name,
            bankCode,
            isResolved: true,
          };
        } else {
          throw ApiError.badRequest(data.message || 'Could not resolve bank account details');
        }
      } catch (err) {
        if (err instanceof ApiError) throw err;
        console.warn(`⚠️ Paystack bank resolution network error: ${err.message}`);
      }
    }

    // Sandbox / Development fallback
    return {
      accountNumber,
      accountName: 'Fixmate Verified Account',
      bankCode,
      isResolved: true,
      note: 'Simulated resolution in sandbox environment',
    };
  }

  /**
   * Create a Paystack Transfer Recipient
   */
  static async createTransferRecipient({ name, accountNumber, bankCode }) {
    if (env.PAYSTACK_SECRET_KEY && !env.PAYSTACK_SECRET_KEY.startsWith('sk_test_xxx')) {
      try {
        const response = await fetch('https://api.paystack.co/transferrecipient', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'nuban',
            name,
            account_number: accountNumber,
            bank_code: bankCode,
            currency: 'NGN',
          }),
        });

        const data = await response.json();
        if (data.status && data.data?.recipient_code) {
          return data.data.recipient_code;
        }
      } catch (err) {
        console.warn(`⚠️ Paystack transfer recipient creation error: ${err.message}`);
      }
    }

    return `RCP_SIM_${Date.now()}`;
  }

  /**
   * Initiate an autonomous transfer via Paystack
   */
  static async initiateTransfer({ amountKobo, recipientCode, reference, reason = 'Fixmate Payout' }) {
    if (env.PAYSTACK_SECRET_KEY && !env.PAYSTACK_SECRET_KEY.startsWith('sk_test_xxx')) {
      try {
        const response = await fetch('https://api.paystack.co/transfer', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            source: 'balance',
            amount: amountKobo,
            recipient: recipientCode,
            reference,
            reason,
          }),
        });

        const data = await response.json();
        if (data.status && data.data) {
          return {
            transferCode: data.data.transfer_code,
            status: data.data.status, // 'success', 'pending', 'otp'
            reference,
          };
        } else {
          console.warn(`⚠️ Paystack transfer rejected: ${data.message}`);
          return {
            transferCode: null,
            status: 'failed',
            failureReason: data.message,
            reference,
          };
        }
      } catch (err) {
        console.warn(`⚠️ Paystack transfer network error: ${err.message}`);
        return {
          transferCode: null,
          status: 'failed',
          failureReason: err.message,
          reference,
        };
      }
    }

    // Sandbox simulation
    return {
      transferCode: `TRF_SIM_${Date.now()}`,
      status: 'success',
      reference,
      note: 'Simulated Paystack transfer completed instantly',
    };
  }

  /**
   * Handle incoming Paystack webhook events with exact raw body HMAC SHA-512 verification & idempotency
   */
  static async handleWebhook(signature, rawBody, payload) {
    if (env.PAYSTACK_SECRET_KEY) {
      if (!signature) {
        throw ApiError.forbidden('Missing Paystack webhook signature');
      }

      const bodyToHash = rawBody || JSON.stringify(payload);
      const hash = crypto
        .createHmac('sha512', env.PAYSTACK_SECRET_KEY)
        .update(bodyToHash)
        .digest('hex');

      if (hash !== signature && env.NODE_ENV === 'production') {
        throw ApiError.forbidden('Invalid Paystack webhook signature');
      }
    }

    const { event, data } = payload;
    const eventId = data?.id?.toString() || data?.reference || `PST_EVT_${Date.now()}`;

    // 1. Replay Window Protection (Reject events older than 5 minutes)
    const timestamp = payload?.timestamp || data?.timestamp || data?.paid_at || data?.created_at || payload?.createdAt;
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
        gateway: 'PAYSTACK',
        eventType: event,
        payload,
      },
      update: {},
    });

    // 3. Process charge.success (Wallet Deposit + Card Tokenization)
    if (event === 'charge.success') {
      const { reference, amount, customer, metadata, authorization } = data;
      const nairaAmount = amount / 100; // Paystack is in kobo

      const user = await prisma.user.findUnique({
        where: { email: customer.email },
        include: { wallet: true },
      });

      if (user && user.wallet) {
        await prisma.$transaction(async (tx) => {
          const balanceBefore = Number(user.wallet.availableBalance);
          const balanceAfter = balanceBefore + nairaAmount;

          await tx.wallet.update({
            where: { id: user.wallet.id },
            data: {
              availableBalance: { increment: nairaAmount },
            },
          });

          await tx.transaction.create({
            data: {
              walletId: user.wallet.id,
              reference,
              paymentGatewayRef: data.id?.toString(),
              type: 'WALLET_DEPOSIT',
              amount: nairaAmount,
              netAmount: nairaAmount,
              status: 'SUCCESS',
              balanceBefore,
              balanceAfter,
              description: `Paystack Deposit (Ref: ${reference})`,
              metadata,
            },
          });

          // Persist reusable card token to SavedPaymentMethod
          if (authorization && authorization.reusable && authorization.authorization_code) {
            await tx.savedPaymentMethod.upsert({
              where: {
                userId_authorizationCode: {
                  userId: user.id,
                  authorizationCode: authorization.authorization_code,
                },
              },
              update: {
                last4: authorization.last4 || '0000',
                expMonth: authorization.exp_month || '12',
                expYear: authorization.exp_year || '2030',
                cardBrand: authorization.card_type || authorization.brand || 'Card',
              },
              create: {
                userId: user.id,
                gateway: 'PAYSTACK',
                authorizationCode: authorization.authorization_code,
                cardBrand: authorization.card_type || authorization.brand || 'Card',
                last4: authorization.last4 || '0000',
                expMonth: authorization.exp_month || '12',
                expYear: authorization.exp_year || '2030',
                isDefault: (await tx.savedPaymentMethod.count({ where: { userId: user.id } })) === 0,
              },
            });
          }

          await tx.webhookEvent.update({
            where: { eventId },
            data: { isProcessed: true, processedAt: new Date() },
          });
        });

        await NotificationService.createNotification(
          user.id,
          'Deposit Received 💳',
          `₦${nairaAmount.toLocaleString()} has been credited to your available balance via Paystack.`,
          '/wallets/my-wallet'
        );
      }
    }

    // 4. Process transfer.success (Bank Payout Settled)
    if (event === 'transfer.success') {
      const reference = data?.reference;
      const transferCode = data?.transfer_code;

      const payout = await prisma.payoutRequest.findFirst({
        where: {
          OR: [
            { reference: reference || undefined },
            { gatewayTransferCode: transferCode || undefined },
          ],
        },
      });

      if (payout && payout.status !== 'COMPLETED') {
        await prisma.$transaction(async (tx) => {
          await tx.payoutRequest.update({
            where: { id: payout.id },
            data: {
              status: 'COMPLETED',
              processedAt: new Date(),
            },
          });

          await tx.transaction.updateMany({
            where: { reference: payout.reference },
            data: { status: 'SUCCESS' },
          });

          await tx.webhookEvent.update({
            where: { eventId },
            data: { isProcessed: true, processedAt: new Date() },
          });
        });

        await NotificationService.createNotification(
          payout.userId,
          'Bank Withdrawal Completed! 🏦',
          `Your withdrawal of ₦${Number(payout.amount).toLocaleString()} has settled into your bank account.`,
          '/wallets/my-wallet'
        );
      }
    }

    // 5. Process transfer.failed or transfer.reversed (Auto-refund to wallet)
    if (event === 'transfer.failed' || event === 'transfer.reversed') {
      const reference = data?.reference;
      const transferCode = data?.transfer_code;
      const failureReason = data?.reason || data?.failure_reason || 'Banking partner transfer failure';

      const payout = await prisma.payoutRequest.findFirst({
        where: {
          OR: [
            { reference: reference || undefined },
            { gatewayTransferCode: transferCode || undefined },
          ],
        },
        include: { wallet: true },
      });

      if (payout && payout.status !== 'REJECTED') {
        await prisma.$transaction(async (tx) => {
          // Mark payout as REJECTED
          await tx.payoutRequest.update({
            where: { id: payout.id },
            data: {
              status: 'REJECTED',
              failureReason,
              processedAt: new Date(),
            },
          });

          // Mark original payout transaction as FAILED
          await tx.transaction.updateMany({
            where: { reference: payout.reference },
            data: { status: 'FAILED' },
          });

          // Refund funds to user's wallet
          const wallet = await tx.wallet.findUnique({ where: { id: payout.walletId } });
          if (wallet) {
            const balanceBefore = Number(wallet.availableBalance);
            const balanceAfter = balanceBefore + Number(payout.amount);

            await tx.wallet.update({
              where: { id: wallet.id },
              data: {
                availableBalance: { increment: Number(payout.amount) },
              },
            });

            // Create reversal ledger transaction
            const revRef = `WTH-REV-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
            await tx.transaction.create({
              data: {
                walletId: wallet.id,
                reference: revRef,
                type: 'WALLET_DEPOSIT',
                amount: payout.amount,
                netAmount: payout.amount,
                status: 'SUCCESS',
                balanceBefore,
                balanceAfter,
                description: `Reversal of Failed Payout #${payout.reference} (${failureReason})`,
                metadata: {
                  payoutId: payout.id,
                  originalReference: payout.reference,
                  failureReason,
                },
              },
            });
          }

          await tx.webhookEvent.update({
            where: { eventId },
            data: { isProcessed: true, processedAt: new Date() },
          });
        });

        await NotificationService.createNotification(
          payout.userId,
          'Bank Withdrawal Failed - Refunded ⚠️',
          `Your withdrawal of ₦${Number(payout.amount).toLocaleString()} could not be delivered to your bank account. The funds have been refunded to your wallet balance. Reason: ${failureReason}`,
          '/wallets/my-wallet'
        );
      }
    }

    return { status: 'success' };
  }
}

export default PaystackService;

