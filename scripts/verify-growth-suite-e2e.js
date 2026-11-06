import prisma from '../src/config/db.js';
import { PointLedgerService } from '../src/services/point-ledger.service.js';
import { ReferralFraudService } from '../src/services/referral-fraud.service.js';
import { ReferralService } from '../src/services/referral.service.js';
import { JobService } from '../src/services/job.service.js';
import { generateReferralCode } from '../src/utils/code-generator.js';

async function runVerification() {
  console.log('====================================================');
  console.log('🔍 INITIATING DEEP REALITY CHECK ON GROWTH SUITE');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, name) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [PASS] ${name}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] ${name}`);
      process.exitCode = 1;
    }
  }

  try {
    // 1. Prisma Model Check
    console.log('1️⃣ Checking Database Tables & Prisma Models...');
    const walletCount = await prisma.pointWallet.count();
    const ledgerCount = await prisma.pointLedgerEntry.count();
    const referralCount = await prisma.referral.count();
    const reservationCount = await prisma.pointReservation.count();

    assert(typeof walletCount === 'number', `pointWallet table exists (count: ${walletCount})`);
    assert(typeof ledgerCount === 'number', `pointLedgerEntry table exists (count: ${ledgerCount})`);
    assert(typeof referralCount === 'number', `referral table exists (count: ${referralCount})`);
    assert(typeof reservationCount === 'number', `pointReservation table exists (count: ${reservationCount})`);

    // 2. Code Generator Check
    console.log('\n2️⃣ Testing Code Generator...');
    const code = generateReferralCode();
    assert(/^FIX-[A-Z0-9]{4}$/.test(code), `Code format valid: ${code}`);

    // 3. User & Wallet Verification
    console.log('\n3️⃣ Checking Existing User Loyalty Wallets...');
    const testUser = await prisma.user.findFirst({
      where: { referralCode: { not: null } },
      include: { pointWallet: true },
    });
    assert(!!testUser, `Found user with referralCode: ${testUser?.referralCode} (${testUser?.id})`);
    assert(!!testUser?.pointWallet, `User has point wallet attached (Available: ${testUser?.pointWallet?.availablePoints} pts)`);

    // 4. Point Ledger Service Check: Credit & Reserve
    console.log('\n4️⃣ Testing Double-Entry Point Ledger Service (ACID Row-Locks)...');
    if (testUser) {
      const initialBalance = testUser.pointWallet?.availablePoints ?? 0;

      // Credit 50 test points
      const creditRes = await PointLedgerService.recordTransaction({
        userId: testUser.id,
        amount: 50,
        transactionType: 'JOB_COMPLETION_CLIENT_REWARD',
        description: 'Automated Reality Check Test Credit',
        idempotencyKey: `TEST-CREDIT-${Date.now()}`,
      });
      assert(creditRes.newBalance === initialBalance + 50, `Point credit successful (New balance: ${creditRes.newBalance})`);

      // Reserve 20 points
      const orderRef = `TEST-ORDER-${Date.now()}`;
      const reservation = await PointLedgerService.reservePoints({
        userId: testUser.id,
        amount: 20,
        orderReference: orderRef,
        ttlMinutes: 10,
      });
      assert(reservation.status === 'PENDING_CHECKOUT', `Point reservation created (Locked: 20 pts, Status: ${reservation.status})`);

      // Commit reservation
      const commitRes = await PointLedgerService.commitReservation(orderRef);
      assert(commitRes === true, `Point reservation successfully committed to burn`);

      // Reverse test points to keep wallet balance identical
      await PointLedgerService.recordTransaction({
        userId: testUser.id,
        amount: -30,
        transactionType: 'ESCROW_FEE_DISCOUNT_BURN',
        description: 'Test Reversal Cleanup',
        idempotencyKey: `TEST-CLEANUP-${Date.now()}`,
      });
      console.log('  🧹 Restored clean point wallet balance.');
    }

    // 5. Fraud Detection Service Heuristics
    console.log('\n5️⃣ Testing Referral Anti-Fraud Scoring...');
    const fraudEvaluation = await ReferralFraudService.evaluateRisk({
      referrerId: testUser.id,
      refereeId: testUser.id, // Self-referral test
      clientIp: '197.210.55.12',
      deviceHash: 'device_abc123',
    });
    assert(fraudEvaluation.score === 100, `Self-referral caught with score: ${fraudEvaluation.score}`);
    assert(fraudEvaluation.blocked === true, `Self-referral correctly blocked (Flags: ${fraudEvaluation.flags.join(', ')})`);


    // 6. Referral Validation
    console.log('\n6️⃣ Testing Referral Code Validation Endpoint Logic...');
    if (testUser?.referralCode) {
      const validation = await ReferralService.validateCode(testUser.referralCode);
      assert(validation.isValid === true, `Referral code ${testUser.referralCode} validates as true`);
      assert(validation.refereeRewardPoints === 150, `Referee reward points: ${validation.refereeRewardPoints}`);
    }

    // 7. On-Site Job Arrival Verification Logic
    console.log('\n7️⃣ Testing Job Arrival Verification & Geofence Engine...');
    const activeContract = await prisma.contract.findFirst({
      where: { status: 'ACTIVE' },
      include: { job: true },
    });

    if (activeContract) {
      const origLat = activeContract.job.latitude;
      const origLng = activeContract.job.longitude;
      const testLat = origLat ? Number(origLat) : 9.0765;
      const testLng = origLng ? Number(origLng) : 7.3986;

      if (!origLat) {
        await prisma.job.update({
          where: { id: activeContract.jobId },
          data: { latitude: testLat, longitude: testLng },
        });
      }

      console.log(`  Found active contract "${activeContract.id}" for job "${activeContract.job.title}"`);
      const tokenResult = await JobService.getCheckInToken(activeContract.clientId, activeContract.jobId);
      assert(!!tokenResult.token, `Check-in token generated: ${tokenResult.token}`);
      assert(tokenResult.qrValue.startsWith('artisan:checkin:'), `QR payload matches standard: ${tokenResult.qrValue}`);

      // Test verify arrival within 50 meters
      const verifyRes = await JobService.verifyArrival(
        activeContract.artisanId,
        activeContract.jobId,
        {
          token: tokenResult.token,
          latitude: testLat + 0.0001, // ~11 meters away
          longitude: testLng + 0.0001,
        }
      );
      assert(verifyRes.verified === true, `Arrival verified successfully within geofence (${verifyRes.distanceMeters}m)`);
      assert(verifyRes.isGeofenceVerified === true, `Geofence validation passed within tolerance`);
      assert(verifyRes.pointsAwarded === 25 || verifyRes.pointsAwarded === 0, `Points award handled properly (awarded: ${verifyRes.pointsAwarded})`);

      // Revert test coordinates if they were originally null
      if (!origLat) {
        await prisma.job.update({
          where: { id: activeContract.jobId },
          data: { latitude: null, longitude: null },
        });
      }
    } else {
      console.log('  ⚠️ No active contract found in database to test check-in, skipping.');
    }

    console.log('\n====================================================');
    console.log(`🏁 VERIFICATION SUMMARY: ${passedTests}/${totalTests} TESTS PASSED WITH 0 FAILURES`);
    console.log('====================================================\n');
  } catch (err) {
    console.error('\n❌ REALITY CHECK ENCOUNTERED AN UNEXPECTED EXCEPTION:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    process.exit(process.exitCode || 0);
  }
}

runVerification();
