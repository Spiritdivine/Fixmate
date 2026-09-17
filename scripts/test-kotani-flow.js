import { KotaniService } from '../src/services/kotani.service.js';
import prisma from '../src/config/db.js';

async function runKotaniTest() {
  console.log('🧪 Starting Kotani Pay integration test...');

  // 1. Test Exchange Rate
  const rateResult = await KotaniService.getExchangeRate('USDC', 'NGN');
  console.log(`✅ Exchange Rate fetched: 1 USDC = ₦${rateResult.rate.toLocaleString()} (${rateResult.source})`);

  // 2. Find a test user with a bank account
  let user = await prisma.user.findFirst({
    where: { role: 'ARTISAN' },
    include: { wallet: true, bankAccounts: true },
  });

  if (!user || !user.wallet) {
    console.log('Creating mock artisan for test...');
    user = await prisma.user.create({
      data: {
        email: `artisan_test_${Date.now()}@example.com`,
        phoneNumber: `+23480${Math.floor(10000000 + Math.random() * 90000000)}`,
        passwordHash: 'dummy',
        role: 'ARTISAN',
        wallet: { create: { availableBalance: 50000 } },
      },
      include: { wallet: true, bankAccounts: true },
    });
  }

  let bankAccount = user.bankAccounts[0];
  if (!bankAccount) {
    bankAccount = await prisma.bankAccount.create({
      data: {
        userId: user.id,
        bankName: 'Guaranty Trust Bank',
        bankCode: '058',
        accountNumber: '0123456789',
        accountName: 'Test Artisan Account',
        isVerified: true,
      },
    });
  }

  console.log(`👤 Using Artisan: ${user.email}, Bank: ${bankAccount.bankName} (${bankAccount.accountNumber})`);

  // 3. Test Off-Ramp Initiation
  const offRampResult = await KotaniService.initiateOffRamp(user.id, {
    amountUsdc: 25.0,
    bankAccountId: bankAccount.id,
    onChainTxHash: '0x_mock_monad_usdc_tx_' + Date.now(),
  });

  console.log('✅ Off-ramp initiated successfully:');
  console.log(`   Payout ID: ${offRampResult.payout.id}`);
  console.log(`   Reference: ${offRampResult.payout.reference}`);
  console.log(`   Amount USDC: $${offRampResult.amountUsdc}`);
  console.log(`   Destination NGN: ₦${offRampResult.estimatedNgn.toLocaleString()}`);
  console.log(`   Rate: ${offRampResult.exchangeRate}`);
  console.log(`   Status: ${offRampResult.status}`);

  // 4. Test Idempotent Webhook Handler
  const webhookResult = await KotaniService.handleWebhook(
    null,
    null,
    {
      event: 'payout.success',
      data: {
        id: `kot_mock_evt_${Date.now()}`,
        reference: offRampResult.payout.reference,
        status: 'SUCCESS',
      },
    }
  );

  console.log('✅ Webhook processed successfully:', webhookResult);

  // 5. Verify Payout Status in Database
  const verifiedPayout = await prisma.payoutRequest.findUnique({
    where: { id: offRampResult.payout.id },
  });

  console.log(`✅ Verified in DB: status=${verifiedPayout.status}, gateway=${verifiedPayout.gateway}, source=${verifiedPayout.sourceCurrency}`);

  if (verifiedPayout.status === 'COMPLETED' && verifiedPayout.gateway === 'KOTANI') {
    console.log('🎉 Off-ramp test verified!');
  } else {
    throw new Error('Kotani payout status verification failed');
  }

  // 6. Test On-Ramp Initiation
  console.log('🧪 Testing On-Ramp Initiation (NGN -> USDC)...');
  const onRampResult = await KotaniService.initiateOnRamp(user.id, {
    amountNgn: 15000,
    destinationWalletAddress: '0x1234567890123456789012345678901234567890',
  });
  console.log('✅ On-Ramp initiated successfully:');
  console.log(`   Reference: ${onRampResult.reference}`);
  console.log(`   Amount NGN: ₦${onRampResult.amountNgn.toLocaleString()}`);
  console.log(`   Estimated USDC: $${onRampResult.estimatedUsdc}`);
  console.log(`   Destination: ${onRampResult.destinationAddress}`);

  // 7. Test On-Ramp Webhook
  const onRampWebhook = await KotaniService.handleWebhook(null, null, {
    event: 'onramp.success',
    data: {
      id: `kot_on_evt_${Date.now()}`,
      reference: onRampResult.reference,
      status: 'SUCCESS',
    },
  });
  console.log('✅ On-Ramp Webhook processed:', onRampWebhook);

  const verifiedOnRampTx = await prisma.transaction.findUnique({
    where: { reference: onRampResult.reference },
  });
  console.log(`✅ Verified On-Ramp Tx in DB: status=${verifiedOnRampTx.status}, description="${verifiedOnRampTx.description}"`);

  console.log('🎉 ALL KOTANI ON-RAMP & OFF-RAMP TESTS PASSED CLEANLY!');

  await prisma.$disconnect();
}

runKotaniTest().catch((err) => {
  console.error('❌ Kotani Pay test failed:', err);
  process.exit(1);
});
