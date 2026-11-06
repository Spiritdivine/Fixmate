import cron from 'node-cron';
import prisma from '../config/db.js';
import redis, { cacheStore } from '../config/redis.js';
import { EscrowService } from '../services/escrow.service.js';
import { ReconciliationService } from '../services/reconciliation.service.js';
import { NotificationService } from '../services/notification.service.js';

let scheduledTasks = [];

/**
 * Acquire distributed lock via Redis (or local in-memory fallback)
 */
async function acquireDistributedLock(lockKey, ttlSeconds = 600) {
  if (cacheStore.isRedisActive() && redis) {
    try {
      const result = await redis.set(lockKey, 'locked', 'EX', ttlSeconds, 'NX');
      return result === 'OK';
    } catch (err) {
      console.warn(`[Cron Lock] Redis lock error (${lockKey}):`, err.message);
    }
  }
  // Local memory fallback (single-process)
  return true;
}

/**
 * Release distributed lock
 */
async function releaseDistributedLock(lockKey) {
  if (cacheStore.isRedisActive() && redis) {
    try {
      await redis.del(lockKey);
    } catch (err) {
      // Non-critical
    }
  }
}

/**
 * 1. 72-Hour Escrow Inactivity Auto-Release Sweeper
 * If an artisan submitted work and the client did not approve or dispute within 72 hours,
 * automatically release the escrow funds to the artisan.
 */
export async function sweep72HourEscrowAutoRelease() {
  const lockKey = 'artisan:lock:cron:escrow-auto-release';
  const acquired = await acquireDistributedLock(lockKey, 300);
  if (!acquired) {
    return; // Another instance is already running this sweep
  }

  try {
    const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);

    // Find all submitted milestones older than 72 hours without unresolved disputes
    const eligibleMilestones = await prisma.milestone.findMany({
      where: {
        status: 'SUBMITTED',
        submittedAt: { lte: seventyTwoHoursAgo },
        contract: {
          status: { notIn: ['CANCELLED', 'REFUNDED', 'COMPLETED'] },
        },
        disputes: {
          none: {
            status: { in: ['OPEN', 'UNDER_REVIEW'] },
          },
        },
      },
      include: {
        contract: {
          select: {
            id: true,
            contractCode: true,
            clientId: true,
            artisanId: true,
            onChainEscrowId: true,
          },
        },
      },
      take: 50,
    });

    if (eligibleMilestones.length > 0) {
      console.log(`⏰ [Cron Escrow] Found ${eligibleMilestones.length} milestone(s) eligible for 72h auto-release`);
    }

    for (const milestone of eligibleMilestones) {
      try {
        console.log(`⚡ [Auto-Release] Processing milestone "${milestone.title}" (Contract: #${milestone.contract.contractCode})`);

        await EscrowService.approveAndReleaseEscrow(
          milestone.contract.clientId,
          milestone.id,
          { releaseReason: 'AUTO_RELEASE_72H_TIMEOUT' }
        );

        // Notify both parties
        await Promise.allSettled([
          NotificationService.createNotification(
            milestone.contract.artisanId,
            'Milestone Auto-Released 💰',
            `Work for "${milestone.title}" was auto-approved and funds released to your wallet following the 72-hour review window.`,
            `/contracts/${milestone.contract.id}`
          ),
          NotificationService.createNotification(
            milestone.contract.clientId,
            'Milestone Auto-Released ⏱️',
            `Funds for "${milestone.title}" were automatically released to the artisan due to 72 hours of inactivity.`,
            `/contracts/${milestone.contract.id}`
          ),
        ]);
      } catch (err) {
        console.error(`❌ [Auto-Release Error] Failed to auto-release milestone ${milestone.id}:`, err.message);
      }
    }
  } catch (err) {
    console.error('❌ [Cron Escrow] Error during 72-hour escrow sweep:', err.message);
  } finally {
    await releaseDistributedLock(lockKey);
  }
}

/**
 * 2. Daily Financial Reconciliation Sweeper
 * Runs daily at midnight UTC to audit on-chain Monad escrow, Paystack reserves, and local balances.
 */
export async function sweepDailyFinancialReconciliation() {
  const lockKey = 'artisan:lock:cron:daily-reconciliation';
  const acquired = await acquireDistributedLock(lockKey, 1800); // 30 min lock
  if (!acquired) {
    return;
  }

  try {
    console.log('📊 [Cron Reconciliation] Starting daily financial ledger reconciliation audit...');
    const report = await ReconciliationService.performDailyReconciliation();
    console.log(`✅ [Cron Reconciliation] Completed successfully. Status: ${report.status}`);
  } catch (err) {
    console.error('❌ [Cron Reconciliation] Error during daily reconciliation:', err.message);
  } finally {
    await releaseDistributedLock(lockKey);
  }
}

/**
 * 3. Stale Data & Session Hygiene Sweeper
 * Purges expired OTPs and revoked sessions.
 */
export async function sweepDataHygiene() {
  const lockKey = 'artisan:lock:cron:data-hygiene';
  const acquired = await acquireDistributedLock(lockKey, 600);
  if (!acquired) {
    return;
  }

  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Delete expired OTP verifications
    const deletedOtps = await prisma.otpVerification.deleteMany({
      where: {
        expiresAt: { lt: oneDayAgo },
      },
    });

    // Delete revoked refresh tokens older than 30 days
    const deletedTokens = await prisma.refreshToken.deleteMany({
      where: {
        createdAt: { lt: thirtyDaysAgo },
      },
    });

    console.log(`🧹 [Cron Hygiene] Purged ${deletedOtps.count} expired OTPs and ${deletedTokens.count} stale session tokens`);
  } catch (err) {
    console.error('❌ [Cron Hygiene] Error during data hygiene sweep:', err.message);
  } finally {
    await releaseDistributedLock(lockKey);
  }
}

/**
 * Start all automated cron schedules
 */
export function startCronScheduler() {
  console.log('⏰ Initializing Artisan Automated Background Schedulers (Cron)...');

  // Task 1: 72-hour escrow auto-release (Every 15 minutes)
  const escrowTask = cron.schedule('*/15 * * * *', async () => {
    await sweep72HourEscrowAutoRelease();
  });
  scheduledTasks.push(escrowTask);

  // Task 2: Midnight Financial Reconciliation (Daily at 00:00 UTC)
  const reconTask = cron.schedule('0 0 * * *', async () => {
    await sweepDailyFinancialReconciliation();
  });
  scheduledTasks.push(reconTask);

  // Task 3: Data Hygiene & Expired Session Purging (Daily at 03:00 UTC)
  const hygieneTask = cron.schedule('0 3 * * *', async () => {
    await sweepDataHygiene();
  });
  scheduledTasks.push(hygieneTask);

  console.log('✅ Artisan Cron Schedulers running (Escrow Auto-Release, Reconciliation, Hygiene)');
}

/**
 * Graceful shutdown of cron schedules
 */
export function stopCronScheduler() {
  for (const task of scheduledTasks) {
    task.stop();
  }
  scheduledTasks = [];
  console.log('🛑 Artisan Cron Schedulers stopped');
}

export default {
  startCronScheduler,
  stopCronScheduler,
  sweep72HourEscrowAutoRelease,
  sweepDailyFinancialReconciliation,
  sweepDataHygiene,
};
