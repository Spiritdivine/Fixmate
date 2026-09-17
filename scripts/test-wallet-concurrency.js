import { WalletService } from '../src/services/wallet.service.js';
import prisma from '../src/config/db.js';

async function testConcurrency() {
  console.log('🔒 Testing Database Pessimistic Locking & Concurrency Defense...');

  // 1. Create a dedicated test user with ₦10,000 balance
  const testUser = await prisma.user.create({
    data: {
      email: `concurrency_test_${Date.now()}@example.com`,
      phoneNumber: `+23480${Math.floor(10000000 + Math.random() * 90000000)}`,
      passwordHash: 'dummy',
      role: 'ARTISAN',
      isKycVerified: true, // Allow higher limit so we only test race conditions
      wallet: {
        create: {
          availableBalance: 10000.00,
        },
      },
      bankAccounts: {
        create: {
          bankName: 'Test Bank',
          bankCode: '058',
          accountNumber: '1122334455',
          accountName: 'Concurrency Test Account',
          isVerified: true,
        },
      },
    },
    include: { wallet: true, bankAccounts: true },
  });

  const bankAccount = testUser.bankAccounts[0];
  console.log(`👤 Created Test User: ${testUser.email} with initial balance: ₦${Number(testUser.wallet.availableBalance).toLocaleString()}`);

  // 2. Dispatch 5 simultaneous payout requests of ₦6,000 each in parallel
  // With ₦10,000 initial balance, ONLY 1 should succeed. 4 must fail with Insufficient Balance.
  console.log('⚡ Firing 5 simultaneous parallel withdrawal requests of ₦6,000 each...');
  const withdrawalAmount = 6000;

  const results = await Promise.allSettled([
    WalletService.requestPayout(testUser.id, withdrawalAmount, bankAccount.id),
    WalletService.requestPayout(testUser.id, withdrawalAmount, bankAccount.id),
    WalletService.requestPayout(testUser.id, withdrawalAmount, bankAccount.id),
    WalletService.requestPayout(testUser.id, withdrawalAmount, bankAccount.id),
    WalletService.requestPayout(testUser.id, withdrawalAmount, bankAccount.id),
  ]);

  let successes = 0;
  let rejections = 0;

  results.forEach((res, index) => {
    if (res.status === 'fulfilled') {
      successes++;
      console.log(`   [Request #${index + 1}] ✅ SUCCEEDED (Payout created: ${res.value.reference})`);
    } else {
      rejections++;
      console.log(`   [Request #${index + 1}] 🛡️ BLOCKED AS EXPECTED: ${res.reason?.message || res.reason}`);
    }
  });

  // 3. Check final wallet balance in database
  const updatedWallet = await prisma.wallet.findUnique({
    where: { userId: testUser.id },
  });

  const finalBalance = Number(updatedWallet.availableBalance);
  console.log(`\n📊 Final Wallet Available Balance: ₦${finalBalance.toLocaleString()}`);

  // 4. Assertions
  if (successes === 1 && rejections === 4 && finalBalance === 4000) {
    console.log('🎉 TEST PASSED: Pessimistic row locking successfully serialized concurrent transactions!');
    console.log('   Zero race conditions. Zero overdrafts. Balance is strictly consistent.');
  } else {
    console.error('❌ TEST FAILED: Overdraft or race condition detected!');
    console.error(`   Successes: ${successes}, Rejections: ${rejections}, Final Balance: ${finalBalance}`);
    process.exit(1);
  }

  // Cleanup test user
  await prisma.payoutRequest.deleteMany({ where: { userId: testUser.id } });
  await prisma.transaction.deleteMany({ where: { walletId: testUser.wallet.id } });
  await prisma.bankAccount.deleteMany({ where: { userId: testUser.id } });
  await prisma.wallet.delete({ where: { id: testUser.wallet.id } });
  await prisma.user.delete({ where: { id: testUser.id } });
  console.log('🧹 Cleaned up test data.');
}

testConcurrency()
  .catch((err) => {
    console.error('Test execution error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
