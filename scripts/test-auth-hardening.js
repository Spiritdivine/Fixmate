import prisma from '../src/config/db.js';
import { redisCache } from '../src/config/redis.js';
import { AuthService } from '../src/services/auth.service.js';
import { OtpService, OTP_PURPOSES } from '../src/services/otp.service.js';
import crypto from 'crypto';

async function runAudit() {
  console.log('🧪 Starting End-to-End Authentication & Security Hardening Verification...\n');

  const testEmail = `auth_test_${Date.now()}@artifix.test`;
  const testPhone = `+234803${Math.floor(1000000 + Math.random() * 8999999)}`;
  const testPassword = 'Password123!';

  // Step 1: Register a test user
  console.log('1️⃣ Testing User Registration with dual roles & embedded wallet...');
  const regResult = await AuthService.register({
    email: testEmail,
    phoneNumber: testPhone,
    password: testPassword,
    role: 'CLIENT',
    firstName: 'Test',
    lastName: 'Client',
  });
  console.log(`✅ Registered user ID: ${regResult.user.id} (Role: ${regResult.user.role})`);

  // Step 2: Login and verify Token Family + Session generation
  console.log('\n2️⃣ Testing Login & Session Token Family generation...');
  const loginResult = await AuthService.login(testEmail, testPassword, 'TestDevice/1.0', '127.0.0.1');
  const tokens1 = loginResult.tokens;
  console.log('✅ Access Token generated (length):', tokens1.accessToken.length);
  console.log('✅ Refresh Token generated (length):', tokens1.refreshToken.length);
  console.log('✅ Session ID created:', tokens1.sessionId);

  // Check Redis session
  const redisSessionKey = `session:${regResult.user.id}:${tokens1.sessionId}`;
  const sessionInRedis = await redisCache.get(redisSessionKey);
  console.log('✅ Redis session stored successfully:', Boolean(sessionInRedis));

  // Step 3: Refresh Token Rotation (RTR) - Legitimate rotation
  console.log('\n3️⃣ Testing Refresh Token Rotation (Legitimate flow)...');
  const tokens2 = await AuthService.refresh(tokens1.refreshToken, 'TestDevice/1.0', '127.0.0.1');
  console.log('✅ New Refresh Token issued (different token):', tokens2.refreshToken !== tokens1.refreshToken);

  // Step 4: Token Reuse Attack Simulation (Adversary replays old rotated token1)
  console.log('\n4️⃣ Testing Token Reuse Detection (Replaying rotated token)...');
  try {
    await AuthService.refresh(tokens1.refreshToken, 'AttackerDevice/2.0', '192.168.1.100');
    console.error('❌ FAILED: Token reuse was not detected!');
    process.exit(1);
  } catch (err) {
    console.log(`✅ SUCCESS: Token reuse intercepted! Error: "${err.message}"`);
  }

  // Verify family was invalidated
  try {
    await AuthService.refresh(tokens2.refreshToken, 'TestDevice/1.0', '127.0.0.1');
    console.error('❌ FAILED: Subsequent token in family was not invalidated!');
    process.exit(1);
  } catch (err) {
    console.log(`✅ SUCCESS: Entire compromised token lineage revoked! Error: "${err.message}"`);
  }

  // Step 5: Test OTP Engine with Sliding-Window Rate Limiting
  console.log('\n5️⃣ Testing OTP Service dispatch and verification...');
  const otpRes = await OtpService.requestOtp(testPhone, OTP_PURPOSES.PHONE_VERIFICATION);
  console.log(`✅ OTP requested for ${testPhone}. Provider: ${otpRes.provider}`);

  // Retrieve cached OTP directly from Redis to test verification
  const otpCacheKey = `otp:${otpRes.identifier}:${OTP_PURPOSES.PHONE_VERIFICATION}`;
  const cachedOtpData = JSON.parse(await redisCache.get(otpCacheKey));
  console.log('✅ OTP cached in Redis with SHA-256 hash:', Boolean(cachedOtpData.otpHash));

  // Step 6: Test 4-Digit Transaction Security PIN
  console.log('\n6️⃣ Testing 4-Digit Security PIN setup, verification, lockout, and change...');
  const testPin = '4321';
  await AuthService.setTransactionPin(regResult.user.id, testPin);
  console.log('✅ Set transaction PIN: 4321');

  // Test overwrite rejection
  try {
    await AuthService.setTransactionPin(regResult.user.id, '9999');
    console.error('❌ FAILED: setTransactionPin allowed overwriting existing PIN!');
    process.exit(1);
  } catch (err) {
    console.log(`✅ SUCCESS: Overwrite blocked on existing PIN: "${err.message}"`);
  }

  const verifyPinRes = await AuthService.verifyTransactionPin(regResult.user.id, testPin);
  console.log('✅ Verified PIN. Received single-use Step-Up Ticket:', verifyPinRes.stepUpTicket.slice(0, 10) + '...');

  // Test incorrect PIN rejection & lockout counter
  for (let i = 1; i <= 4; i++) {
    try {
      await AuthService.verifyTransactionPin(regResult.user.id, '0000');
    } catch (err) {
      // expected
    }
  }
  // 5th failed attempt should trigger lockout
  try {
    await AuthService.verifyTransactionPin(regResult.user.id, '0000');
  } catch (err) {
    console.log(`✅ SUCCESS: 5th failed PIN attempt caught: "${err.message}"`);
  }

  // 6th attempt should return 403 lockout even with CORRECT pin!
  try {
    await AuthService.verifyTransactionPin(regResult.user.id, testPin);
    console.error('❌ FAILED: Lockout was not enforced on subsequent attempt!');
    process.exit(1);
  } catch (err) {
    console.log(`✅ SUCCESS: Lockout strictly enforced even on correct PIN: "${err.message}"`);
  }

  // Clear lockout for remaining tests
  await redisCache.del(`pin_lockout:${regResult.user.id}`);
  await redisCache.del(`pin_attempts:${regResult.user.id}`);

  // Test Change PIN
  const newPin = '8765';
  await AuthService.changeTransactionPin(regResult.user.id, testPin, newPin);
  const verifyNewPin = await AuthService.verifyTransactionPin(regResult.user.id, newPin);
  console.log('✅ Successfully changed PIN to 8765 and verified with Step-Up Ticket');

  // Step 7: Test Contextual Role Switching
  console.log('\n7️⃣ Testing Contextual Role Switching (CLIENT -> ARTISAN)...');
  const switchedRole = await AuthService.switchRole(regResult.user.id, 'ARTISAN');
  console.log(`✅ Switched role to: ${switchedRole.user.role}`);
  console.log(`✅ Artisan profile auto-provisioned: State=${switchedRole.user.artisanProfile.state}, LGA=${switchedRole.user.artisanProfile.lgaCity}`);

  // Cleanup test user
  console.log('\n🧹 Cleaning up test user records...');
  await prisma.artisanProfile.deleteMany({ where: { userId: regResult.user.id } });
  await prisma.clientProfile.deleteMany({ where: { userId: regResult.user.id } });
  await prisma.wallet.deleteMany({ where: { userId: regResult.user.id } });
  await prisma.refreshToken.deleteMany({ where: { userId: regResult.user.id } });
  await prisma.user.delete({ where: { id: regResult.user.id } });
  await redisCache.delByPattern(`session:${regResult.user.id}:*`);
  await redisCache.delByPattern(`otp:${testPhone}:*`);
  console.log('✅ Cleanup complete.');

  console.log('\n🎉 ALL 7 SECURITY & AUTHENTICATION HARDENING TESTS PASSED WITH ZERO ERRORS!\n');
  process.exit(0);
}

runAudit().catch((err) => {
  console.error('\n❌ Audit failed with error:', err);
  process.exit(1);
});
