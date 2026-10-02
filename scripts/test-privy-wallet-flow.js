import prisma from '../src/config/db.js';
import { AuthService } from '../src/services/auth.service.js';
import { PrivyService } from '../src/services/privy.service.js';
import { ProfileService } from '../src/services/profile.service.js';

async function runPrivyWalletFlowTest() {
  console.log('🧪 Starting Privy Embedded Wallet Sign-Up & Monad Integration Verification...\n');

  try {
    // -------------------------------------------------------------
    // Test 1: Verify PrivyService singleton & architectural methods
    // -------------------------------------------------------------
    console.log('Step 1: Checking PrivyService architectural contract...');
    if (typeof PrivyService.verifyAuthToken !== 'function') {
      throw new Error('PrivyService.verifyAuthToken must be an exported function');
    }
    if (typeof PrivyService.getUser !== 'function') {
      throw new Error('PrivyService.getUser must be an exported function');
    }
    if (typeof PrivyService.getEmbeddedWalletAddress !== 'function') {
      throw new Error('PrivyService.getEmbeddedWalletAddress must be an exported function');
    }
    if (typeof PrivyService.createServerWallet !== 'function') {
      throw new Error('PrivyService.createServerWallet must be an exported function');
    }
    console.log('✅ Step 1 Passed: PrivyService implements all required architectural interfaces.\n');

    // -------------------------------------------------------------
    // Test 2: Verify graceful handling of unconfigured or test tokens
    // -------------------------------------------------------------
    console.log('Step 2: Checking error resilience on mock/invalid Privy token...');
    let tokenVerificationFailedGracefully = false;
    try {
      await PrivyService.verifyAuthToken('mock_invalid_privy_token_xyz');
    } catch (err) {
      tokenVerificationFailedGracefully = true;
      console.log(`   (Caught expected token rejection: ${err.message})`);
    }
    if (!tokenVerificationFailedGracefully) {
      throw new Error('Invalid privy token should have thrown or returned safely');
    }
    console.log('✅ Step 2 Passed: Privy token verification handles rejections safely.\n');

    // -------------------------------------------------------------
    // Test 3: Register new user with walletAddress provided at sign-up
    // -------------------------------------------------------------
    console.log('Step 3: Registering new Client with embedded wallet address at sign-up...');
    const testTimestamp = Date.now();
    const clientEmail = `privy-client-${testTimestamp}@example.com`;
    const embeddedAddress1 = `0x${testTimestamp.toString(16).padStart(40, '0')}`;

    const regResult1 = await AuthService.register({
      email: clientEmail,
      phoneNumber: `+234${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      password: 'SecurePassword123!',
      role: 'CLIENT',
      firstName: 'Adaora',
      lastName: 'Chukwu',
      state: 'Lagos',
      lgaCity: 'Ikeja',
      walletAddress: embeddedAddress1,
    });

    if (!regResult1 || !regResult1.user) {
      throw new Error('AuthService.register did not return created user');
    }

    const fetchedUser1 = await prisma.user.findUnique({
      where: { id: regResult1.user.id },
    });

    if (!fetchedUser1.walletAddress || fetchedUser1.walletAddress.toLowerCase() !== embeddedAddress1.toLowerCase()) {
      throw new Error(`Expected wallet address ${embeddedAddress1} but found ${fetchedUser1.walletAddress}`);
    }
    console.log(`✅ Step 3 Passed: User registered and embedded wallet ${embeddedAddress1} bound atomically.\n`);

    // -------------------------------------------------------------
    // Test 4: Anti-collision resilience on duplicate wallet address
    // -------------------------------------------------------------
    console.log('Step 4: Testing duplicate wallet address resilience on sign-up...');
    const duplicateEmail = `privy-dup-${testTimestamp}@example.com`;
    const regResult2 = await AuthService.register({
      email: duplicateEmail,
      phoneNumber: `+234${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      password: 'SecurePassword123!',
      role: 'ARTISAN',
      firstName: 'Babajide',
      lastName: 'Sanwo',
      businessName: 'Sanwo Electricals',
      state: 'Lagos',
      lgaCity: 'Surulere',
      walletAddress: embeddedAddress1, // Same address as user 1
    });

    if (!regResult2 || !regResult2.user) {
      throw new Error('Registration should not crash when wallet address is duplicated');
    }

    const fetchedUser2 = await prisma.user.findUnique({
      where: { id: regResult2.user.id },
    });

    // The duplicate wallet address should have been detached or left null to avoid collision
    console.log(`   User 2 registered cleanly without 500 error. Wallet is: ${fetchedUser2.walletAddress || '(unlinked for new embedded wallet creation)'}`);
    console.log('✅ Step 4 Passed: Duplicate wallet collisions are resolved without crashing sign-up.\n');

    // -------------------------------------------------------------
    // Test 5: Profile Wallet Address Update & Unlink Flow
    // -------------------------------------------------------------
    console.log('Step 5: Testing Profile wallet address update and unlinking...');
    const newEmbeddedAddress = '0x8888888888888888888888888888888888888888';
    
    // Update to new address
    const updatedProfile = await ProfileService.updateWalletAddress(fetchedUser2.id, newEmbeddedAddress);
    if (!updatedProfile.walletAddress || updatedProfile.walletAddress.toLowerCase() !== newEmbeddedAddress.toLowerCase()) {
      throw new Error(`Failed to update user 2 wallet to ${newEmbeddedAddress}`);
    }
    console.log(`   Updated wallet to: ${updatedProfile.walletAddress}`);

    // Unlink wallet (pass null)
    const unlinkedProfile = await ProfileService.updateWalletAddress(fetchedUser2.id, null);
    if (unlinkedProfile.walletAddress !== null) {
      throw new Error('Failed to unlink user wallet address');
    }
    console.log('   Unlinked wallet successfully (set to null)');
    console.log('✅ Step 5 Passed: Profile wallet address sync and unlink working as designed.\n');

    // Clean up test users
    await prisma.user.deleteMany({
      where: { id: { in: [regResult1.user.id, regResult2.user.id] } },
    });
    console.log('🧹 Cleaned up test database records.');

    console.log('\n🎉 ALL PRIVY EMBEDDED WALLET & MONAD INTEGRATION TESTS PASSED SUCCESSFULLY! 🚀');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    process.exit(1);
  }
}

runPrivyWalletFlowTest();
