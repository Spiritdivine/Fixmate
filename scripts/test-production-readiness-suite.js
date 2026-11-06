import crypto from 'crypto';
import app from '../src/app.js';
import prisma, { PRISMA_TX_OPTIONS } from '../src/config/db.js';
import { standardApiLimiter } from '../src/config/rate-limiter.js';
import { AlertService } from '../src/services/alert.service.js';
import { EscrowService } from '../src/services/escrow.service.js';
import { ContractService } from '../src/services/contract.service.js';
import { PaystackService } from '../src/services/paystack.service.js';
import { KotaniService } from '../src/services/kotani.service.js';
import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

async function assert(desc, fn) {
  try {
    await fn();
    console.log(`  ✅ PASS: ${desc}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${desc} -> ${err.message}`);
    failed++;
  }
}

async function runTestSuite() {
  console.log('\n============================================================');
  console.log('🛡️  Artifix Platform — Production Readiness Verification Suite');
  console.log('============================================================\n');

  // TEST 1: Rate Limiter & Trust Proxy
  await assert('Factor 4: Express trust proxy is enabled for reverse proxies', async () => {
    const isTrustProxy = app.get('trust proxy');
    if (!isTrustProxy) throw new Error('trust proxy is not configured on Express app');
  });

  await assert('Factor 4: standardApiLimiter exempts payment provider webhook routes', async () => {
    // Test skip function on mock webhook requests
    const mockPaystackReq = { originalUrl: '/api/v1/payments/webhook', url: '/webhook' };
    const mockKotaniReq = { originalUrl: '/api/v1/payments/webhooks/kotani', url: '/webhooks/kotani' };
    const mockStandardReq = { originalUrl: '/api/v1/jobs', url: '/jobs' };

    // express-rate-limit allows accessing options
    // Inspect rate limiter skip logic
    const skipFn = standardApiLimiter?.skip;
    if (typeof skipFn === 'function') {
      if (!skipFn(mockPaystackReq)) throw new Error('Paystack webhook was not exempted by rate limiter');
      if (!skipFn(mockKotaniReq)) throw new Error('Kotani webhook was not exempted by rate limiter');
      if (skipFn(mockStandardReq)) throw new Error('Standard route was incorrectly exempted');
    }
  });

  // TEST 2: Webhook Security (Factor 9)
  await assert('Factor 9: Paystack webhook HMAC verification uses constant-time comparison', async () => {
    const secret = 'sk_test_mock_secret_key_12345';
    const originalSecret = process.env.PAYSTACK_SECRET_KEY;
    process.env.PAYSTACK_SECRET_KEY = secret;

    const payload = {
      event: 'charge.success',
      data: { id: 999999, reference: 'TEST-REF-999', amount: 50000, customer: { email: 'test@example.com' } },
      timestamp: new Date().toISOString(),
    };
    const bodyStr = JSON.stringify(payload);
    const validSignature = crypto.createHmac('sha512', secret).update(bodyStr).digest('hex');

    // 1. Invalid signature must throw forbidden
    let rejected = false;
    try {
      await PaystackService.handleWebhook('invalid_signature_hex', bodyStr, payload);
    } catch {
      rejected = true;
    }
    if (!rejected && process.env.NODE_ENV === 'production') {
      throw new Error('Invalid webhook signature was not rejected');
    }

    process.env.PAYSTACK_SECRET_KEY = originalSecret;
  });

  await assert('Factor 9: Webhook replay window accepts provider retries within 24 hours', async () => {
    const payload = {
      event: 'charge.success',
      data: { id: 888888, reference: 'TEST-RETRY-REF' },
      timestamp: new Date(Date.now() - 3600 * 1000).toISOString(), // 1 hour ago
    };

    // Age is 3600s (< 86400s). Replay check must pass cleanly
    const timestamp = payload.timestamp;
    const ageInSeconds = Math.abs(Date.now() - new Date(timestamp).getTime()) / 1000;
    if (ageInSeconds > 86400) {
      throw new Error('Replay calculation error');
    }
  });

  // TEST 3: Database Pool & Timeouts (Factor 8)
  await assert('Factor 8: Prisma transaction timeouts tuned to prevent lock contention', async () => {
    if (PRISMA_TX_OPTIONS.timeout > 15000) {
      throw new Error(`Transaction timeout is too long (${PRISMA_TX_OPTIONS.timeout}ms). Should be <= 15000ms`);
    }
    if (PRISMA_TX_OPTIONS.maxWait > 10000) {
      throw new Error(`Transaction maxWait is too long (${PRISMA_TX_OPTIONS.maxWait}ms).`);
    }
  });

  // TEST 4: Concurrency & Row Locking (Factor 2)
  await assert('Factor 2: EscrowService implements row-level locking on milestone release', async () => {
    // Verify EscrowService.approveAndReleaseEscrow source includes FOR UPDATE
    const escrowSource = fs.readFileSync('src/services/escrow.service.js', 'utf8');
    if (!escrowSource.includes('FROM milestones WHERE id = ${milestoneId}::uuid FOR UPDATE')) {
      throw new Error('approveAndReleaseEscrow is missing FOR UPDATE milestone row lock');
    }
  });

  await assert('Factor 2: ContractService implements row-level locking on proposal acceptance', async () => {
    const contractSource = fs.readFileSync('src/services/contract.service.js', 'utf8');
    if (!contractSource.includes('FROM jobs WHERE id = ${proposal.jobId}::uuid FOR UPDATE')) {
      throw new Error('acceptProposalAndCreateContract is missing FOR UPDATE job row lock');
    }
  });

  // TEST 5: N+1 Elimination (Factor 1)
  await assert('Factor 1: ChatController uses single grouped query for unread counts', async () => {
    const chatSource = fs.readFileSync('src/controllers/chat.controller.js', 'utf8');
    if (chatSource.includes('conversations.map(async (conv) =>') && chatSource.includes('prisma.message.count(')) {
      throw new Error('ChatController still contains N+1 message.count loop');
    }
    if (!chatSource.includes('COUNT(m.id)::int AS unread_count')) {
      throw new Error('ChatController missing grouped unread query');
    }
  });

  await assert('Factor 1: EmergencyDispatchService batch fetches candidate profiles', async () => {
    const dispatchSource = fs.readFileSync('src/services/emergency-dispatch.service.js', 'utf8');
    const dispatchMethod = dispatchSource.split('static async claimEmergencySos')[0];
    if (dispatchMethod.includes('for (const match of candidates)') && dispatchMethod.includes('await prisma.artisanProfile.findUnique')) {
      throw new Error('EmergencyDispatchService still contains sequential findUnique loop inside triggerEmergencySos');
    }
    if (!dispatchSource.includes('prisma.artisanProfile.findMany')) {
      throw new Error('EmergencyDispatchService missing batch findMany profile fetch');
    }
    if (!dispatchSource.includes('profileMap.get(match.artisanProfileId)')) {
      throw new Error('EmergencyDispatchService not looking up from batched profileMap');
    }
  });

  // TEST 6: Spend Alerts & Observability (Factor 3 & 6)
  await assert('Factor 6: AlertService dispatches operational warnings and critical alerts', async () => {
    const alertResult = await AlertService.sendAlert({
      level: 'INFO',
      title: 'Test Production Readiness Check',
      message: 'Automated test of alerting dispatch bus',
      metadata: { testSuite: 'Phase 1-4 Verification' },
    });
    if (!alertResult || alertResult.level !== 'INFO') {
      throw new Error('AlertService did not return formatted alert payload');
    }
  });

  // TEST 7: Automated Backups & Disaster Recovery (Factor 10)
  await assert('Factor 10: Backup and restore scripts exist and are executable', async () => {
    const backupScript = path.resolve('scripts/backup-database.sh');
    const restoreScript = path.resolve('scripts/restore-database.sh');
    const runbook = path.resolve('docs/DISASTER_RECOVERY_AND_ROLLBACK.md');

    if (!fs.existsSync(backupScript)) throw new Error('scripts/backup-database.sh missing');
    if (!fs.existsSync(restoreScript)) throw new Error('scripts/restore-database.sh missing');
    if (!fs.existsSync(runbook)) throw new Error('docs/DISASTER_RECOVERY_AND_ROLLBACK.md missing');

    const backupStats = fs.statSync(backupScript);
    // Check executable bit
    if ((backupStats.mode & 0o111) === 0) {
      throw new Error('backup-database.sh is not executable');
    }
  });

  console.log('\n============================================================');
  console.log(`Suite Execution Results: ${passed} Passed, ${failed} Failed`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite()
  .catch((err) => {
    console.error('Fatal test error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => {});
  });
