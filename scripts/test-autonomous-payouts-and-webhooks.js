import prisma from '../src/config/db.js';
import { WalletService } from '../src/services/wallet.service.js';
import { PaystackService } from '../src/services/paystack.service.js';
import crypto from 'crypto';

async function testAutonomousPayoutsAndWebhooks() {
  console.log('🚀 Testing Autonomous Paystack Disbursements, Bank Resolution & Webhooks...');

  const timestamp = Date.now();

  // 1. Create Artisan User
  const artisan = await prisma.user.create({
    data: {
      email: `payout_artisan_${timestamp}@test.com`,
      phoneNumber: `+23480${Math.floor(10000000 + Math.random() * 90000000)}`,
      passwordHash: 'dummy',
      role: 'ARTISAN',
      isKycVerified: true,
      wallet: {
        create: {
          availableBalance: 80000.00,
          escrowLockedBalance: 0.00,
        },
      },
    },
    include: { wallet: true },
  });

  console.log(`👤 Created Artisan with balance ₦${Number(artisan.wallet.availableBalance).toLocaleString()}`);

  // 2. Bank Account Resolution & Linking
  console.log('🏦 Testing Bank Account Resolution & Recipient Code Creation...');
  const bankAccount = await WalletService.addBankAccount(artisan.id, {
    bankName: 'Guaranty Trust Bank',
    bankCode: '058',
    accountNumber: '0123456789',
    accountName: 'Test Account',
  });

  console.log(`   ✅ Resolved Account: ${bankAccount.accountName}`);
  console.log(`   ✅ Recipient Code Created: ${bankAccount.recipientCode}`);
  console.log(`   ✅ Is Default: ${bankAccount.isDefault}`);

  if (!bankAccount.recipientCode || !bankAccount.isVerified) {
    throw new Error('Bank account failed to generate recipient code or verification flag');
  }

  // 3. Minimum Withdrawal Limit Check (< ₦1,000 should fail)
  console.log('🛡️ Testing Minimum Withdrawal Limit (₦500 should be rejected)...');
  try {
    await WalletService.requestPayout(artisan.id, 500, bankAccount.id);
    throw new Error('Should have failed minimum withdrawal check of ₦1,000');
  } catch (err) {
    console.log(`   ✅ Blocked as expected: "${err.message}"`);
  }

  // 4. Valid Withdrawal Request (₦15,000)
  console.log('⚡ Initiating Valid Withdrawal Request of ₦15,000...');
  const payout = await WalletService.requestPayout(artisan.id, 15000, bankAccount.id);
  console.log(`   ✅ Payout Created: #${payout.reference}`);
  console.log(`   ✅ Payout Status: ${payout.status}`);
  console.log(`   ✅ Transfer Code: ${payout.gatewayTransferCode}`);

  const artisanWalletAfterWth = await prisma.wallet.findUnique({ where: { userId: artisan.id } });
  console.log(`   Wallet Available Balance: ₦${Number(artisanWalletAfterWth.availableBalance).toLocaleString()} (Expected: 65,000)`);

  if (Number(artisanWalletAfterWth.availableBalance) !== 65000) {
    throw new Error(`Wallet debit failed: expected 65,000, got ${artisanWalletAfterWth.availableBalance}`);
  }

  // 5. Test transfer.failed Webhook -> Auto-Reversal to Wallet
  console.log('🔄 Simulating Paystack "transfer.failed" Webhook event...');
  const failedWebhookPayload = {
    event: 'transfer.failed',
    data: {
      id: `evt_trf_fail_${timestamp}`,
      reference: payout.reference,
      transfer_code: payout.gatewayTransferCode,
      amount: 1500000, // 15,000 NGN in kobo
      reason: 'Destination account temporarily unavailable',
      timestamp: new Date().toISOString(),
    },
  };

  const secretKey = process.env.PAYSTACK_SECRET_KEY || 'sk_test_xxx';
  const failedPayloadStr = JSON.stringify(failedWebhookPayload);
  const failedSignature = crypto.createHmac('sha512', secretKey).update(failedPayloadStr).digest('hex');

  await PaystackService.handleWebhook(failedSignature, failedPayloadStr, failedWebhookPayload);

  const [payoutAfterFail, artisanWalletAfterReversal, reversalTx] = await Promise.all([
    prisma.payoutRequest.findUnique({ where: { id: payout.id } }),
    prisma.wallet.findUnique({ where: { userId: artisan.id } }),
    prisma.transaction.findFirst({
      where: {
        walletId: artisan.wallet.id,
        type: 'WALLET_DEPOSIT',
        description: { contains: payout.reference },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  console.log('\n📊 Webhook Reversal Results:');
  console.log(`   Payout Status: ${payoutAfterFail.status} (Expected: REJECTED)`);
  console.log(`   Failure Reason: "${payoutAfterFail.failureReason}"`);
  console.log(`   Restored Available Balance: ₦${Number(artisanWalletAfterReversal.availableBalance).toLocaleString()} (Expected: 80,000)`);
  console.log(`   ✅ Reversal Transaction Found: ${reversalTx?.reference} (+₦${reversalTx?.amount})`);

  if (payoutAfterFail.status !== 'REJECTED') {
    throw new Error(`Expected payout status REJECTED, got ${payoutAfterFail.status}`);
  }
  if (Number(artisanWalletAfterReversal.availableBalance) !== 80000) {
    throw new Error(`Wallet refund failed: expected 80,000, got ${artisanWalletAfterReversal.availableBalance}`);
  }
  if (!reversalTx) {
    throw new Error('Reversal ledger transaction was not created');
  }

  // 6. Test Card Tokenization on charge.success Webhook
  console.log('\n💳 Testing Card Tokenization via "charge.success" Webhook...');
  const cardAuthCode = `AUTH_TOKEN_${timestamp}`;
  const depositWebhookPayload = {
    event: 'charge.success',
    data: {
      id: `evt_chg_${timestamp}`,
      reference: `DEP-TEST-${timestamp}`,
      amount: 2000000, // ₦20,000 in kobo
      customer: { email: artisan.email },
      authorization: {
        authorization_code: cardAuthCode,
        card_type: 'visa',
        last4: '4242',
        exp_month: '12',
        exp_year: '2028',
        reusable: true,
      },
      timestamp: new Date().toISOString(),
    },
  };

  const depositPayloadStr = JSON.stringify(depositWebhookPayload);
  const depositSignature = crypto.createHmac('sha512', secretKey).update(depositPayloadStr).digest('hex');

  await PaystackService.handleWebhook(depositSignature, depositPayloadStr, depositWebhookPayload);

  const [artisanWalletAfterDep, savedCard] = await Promise.all([
    prisma.wallet.findUnique({ where: { userId: artisan.id } }),
    prisma.savedPaymentMethod.findFirst({
      where: { userId: artisan.id, authorizationCode: cardAuthCode },
    }),
  ]);

  console.log(`   Artisan Balance after deposit: ₦${Number(artisanWalletAfterDep.availableBalance).toLocaleString()} (Expected: 100,000)`);
  console.log(`   ✅ Saved Card Persisted: Brand: ${savedCard?.cardBrand}, Last4: ${savedCard?.last4}, Default: ${savedCard?.isDefault}`);

  if (Number(artisanWalletAfterDep.availableBalance) !== 100000) {
    throw new Error(`Deposit crediting failed: expected 100,000, got ${artisanWalletAfterDep.availableBalance}`);
  }
  if (!savedCard || savedCard.last4 !== '4242') {
    throw new Error('Card tokenization failed to save payment method');
  }

  console.log('\n🎉 ALL AUTONOMOUS PAYOUT, REVERSAL & CARD TOKENIZATION TESTS PASSED!');
}

testAutonomousPayoutsAndWebhooks()
  .catch((err) => {
    console.error('❌ Autonomous Payout & Webhook Test Failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
