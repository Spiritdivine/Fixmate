import { WalletService } from '../src/services/wallet.service.js';
import { KotaniService } from '../src/services/kotani.service.js';
import prisma from '../src/config/db.js';

async function testKycLimits() {
  console.log('🛡️ Testing Tiered KYC Withdrawal Limits (Fiat & Crypto Off-Ramp)...');

  // 1. Create Tier 1 (Unverified) User
  const tier1User = await prisma.user.create({
    data: {
      email: `tier1_test_${Date.now()}@example.com`,
      phoneNumber: `+23480${Math.floor(10000000 + Math.random() * 90000000)}`,
      passwordHash: 'dummy',
      role: 'ARTISAN',
      isKycVerified: false,
      wallet: {
        create: {
          availableBalance: 2000000.00, // Plenty of balance
        },
      },
      bankAccounts: {
        create: {
          bankName: 'GTBank',
          bankCode: '058',
          accountNumber: '9988776655',
          accountName: 'Tier 1 User',
          isVerified: true,
        },
      },
    },
    include: { wallet: true, bankAccounts: true },
  });

  const tier1Bank = tier1User.bankAccounts[0];
  console.log(`👤 Created Tier 1 User (Unverified): ${tier1User.email}`);

  // Test A: Tier 1 Fiat Withdrawal > ₦50,000 should fail
  let tier1FiatBlocked = false;
  try {
    await WalletService.requestPayout(tier1User.id, 60000, tier1Bank.id);
  } catch (err) {
    if (err.message.includes('Daily withdrawal limit of ₦50,000 exceeded')) {
      tier1FiatBlocked = true;
      console.log(`   ✅ Fiat Tier 1 Blocked as expected: "${err.message}"`);
    } else {
      console.error(`   ❌ Unexpected error message: ${err.message}`);
    }
  }

  // Test B: Tier 1 Kotani Off-Ramp > $50 USDC should fail
  let tier1CryptoBlocked = false;
  try {
    await KotaniService.initiateOffRamp(tier1User.id, {
      amountUsdc: 75.0,
      bankAccountId: tier1Bank.id,
      onChainTxHash: '0x_tier1_tx_hash',
    });
  } catch (err) {
    if (err.message.includes('Daily cash-out limit of $50.00 USDC exceeded')) {
      tier1CryptoBlocked = true;
      console.log(`   ✅ Crypto Tier 1 Blocked as expected: "${err.message}"`);
    } else {
      console.error(`   ❌ Unexpected error message: ${err.message}`);
    }
  }

  // 2. Create Tier 2 (Verified) User
  const tier2User = await prisma.user.create({
    data: {
      email: `tier2_test_${Date.now()}@example.com`,
      phoneNumber: `+23480${Math.floor(10000000 + Math.random() * 90000000)}`,
      passwordHash: 'dummy',
      role: 'ARTISAN',
      isKycVerified: true,
      wallet: {
        create: {
          availableBalance: 2000000.00,
        },
      },
      bankAccounts: {
        create: {
          bankName: 'Zenith Bank',
          bankCode: '057',
          accountNumber: '5566778899',
          accountName: 'Tier 2 User',
          isVerified: true,
        },
      },
    },
    include: { wallet: true, bankAccounts: true },
  });

  const tier2Bank = tier2User.bankAccounts[0];
  console.log(`👤 Created Tier 2 User (Verified): ${tier2User.email}`);

  // Test C: Tier 2 Fiat Withdrawal of ₦60,000 (above Tier 1, below Tier 2) should succeed
  let tier2FiatAllowed = false;
  try {
    const payout = await WalletService.requestPayout(tier2User.id, 60000, tier2Bank.id);
    if (payout && payout.reference) {
      tier2FiatAllowed = true;
      console.log(`   ✅ Fiat Tier 2 allowed ₦60,000 successfully (Ref: ${payout.reference})`);
    }
  } catch (err) {
    console.error(`   ❌ Tier 2 should have been allowed ₦60,000: ${err.message}`);
  }

  // Test D: Tier 2 Fiat Withdrawal > ₦1,000,000 should fail
  let tier2FiatExcessBlocked = false;
  try {
    await WalletService.requestPayout(tier2User.id, 1200000, tier2Bank.id);
  } catch (err) {
    if (err.message.includes('Daily withdrawal limit of ₦1,000,000 exceeded')) {
      tier2FiatExcessBlocked = true;
      console.log(`   ✅ Fiat Tier 2 excess blocked as expected: "${err.message}"`);
    } else {
      console.error(`   ❌ Unexpected error message: ${err.message}`);
    }
  }

  // Test E: Tier 2 Kotani Off-Ramp of $75 USDC should succeed
  let tier2CryptoAllowed = false;
  try {
    const offRamp = await KotaniService.initiateOffRamp(tier2User.id, {
      amountUsdc: 75.0,
      bankAccountId: tier2Bank.id,
      onChainTxHash: '0x_tier2_allowed_tx',
    });
    if (offRamp && offRamp.status) {
      tier2CryptoAllowed = true;
      console.log(`   ✅ Crypto Tier 2 allowed $75 USDC successfully (Payout ID: ${offRamp.payout.id})`);
    }
  } catch (err) {
    console.error(`   ❌ Tier 2 should have been allowed $75 USDC: ${err.message}`);
  }

  // Test F: Tier 2 Kotani Off-Ramp > $1,000 USDC should fail
  let tier2CryptoExcessBlocked = false;
  try {
    await KotaniService.initiateOffRamp(tier2User.id, {
      amountUsdc: 1500.0,
      bankAccountId: tier2Bank.id,
      onChainTxHash: '0x_tier2_excess_tx',
    });
  } catch (err) {
    if (err.message.includes('Daily cash-out limit of $1,000.00 USDC exceeded')) {
      tier2CryptoExcessBlocked = true;
      console.log(`   ✅ Crypto Tier 2 excess blocked as expected: "${err.message}"`);
    } else {
      console.error(`   ❌ Unexpected error message: ${err.message}`);
    }
  }

  // Cleanup
  for (const u of [tier1User, tier2User]) {
    await prisma.payoutRequest.deleteMany({ where: { userId: u.id } });
    await prisma.transaction.deleteMany({ where: { walletId: u.wallet.id } });
    await prisma.bankAccount.deleteMany({ where: { userId: u.id } });
    await prisma.wallet.delete({ where: { id: u.wallet.id } });
    await prisma.user.delete({ where: { id: u.id } });
  }

  console.log('\n📊 Summary of KYC Limits Validation:');
  console.log(`   Tier 1 Fiat Block (> ₦50k): ${tier1FiatBlocked ? 'PASS' : 'FAIL'}`);
  console.log(`   Tier 1 Crypto Block (> $50): ${tier1CryptoBlocked ? 'PASS' : 'FAIL'}`);
  console.log(`   Tier 2 Fiat Allow (₦60k): ${tier2FiatAllowed ? 'PASS' : 'FAIL'}`);
  console.log(`   Tier 2 Fiat Block (> ₦1M): ${tier2FiatExcessBlocked ? 'PASS' : 'FAIL'}`);
  console.log(`   Tier 2 Crypto Allow ($75): ${tier2CryptoAllowed ? 'PASS' : 'FAIL'}`);
  console.log(`   Tier 2 Crypto Block (> $1,000): ${tier2CryptoExcessBlocked ? 'PASS' : 'FAIL'}`);

  if (
    tier1FiatBlocked &&
    tier1CryptoBlocked &&
    tier2FiatAllowed &&
    tier2FiatExcessBlocked &&
    tier2CryptoAllowed &&
    tier2CryptoExcessBlocked
  ) {
    console.log('\n🎉 ALL KYC TIER LIMIT TESTS PASSED PERFECTLY!');
  } else {
    console.error('\n❌ ONE OR MORE KYC TIER LIMIT TESTS FAILED!');
    process.exit(1);
  }
}

testKycLimits()
  .catch((err) => {
    console.error('Test execution error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
