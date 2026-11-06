import { Worker } from 'bullmq';
import { redis, cacheStore } from '../config/redis.js';
import { QUEUE_NAMES } from '../queues/queue.manager.js';
import { ReferralService } from '../services/referral.service.js';
import prisma from '../config/db.js';

let loyaltyWorkerInstance = null;

export function initLoyaltyWorker() {
  if (!cacheStore.isRedisActive() || !redis) {
    console.log('[Worker] Redis inactive. Loyalty Worker running in standalone fallback mode.');
    return null;
  }

  loyaltyWorkerInstance = new Worker(
    QUEUE_NAMES.LOYALTY_POINTS,
    async (job) => {
      const { action, payload } = job.data;

      switch (action) {
        case 'EVALUATE_CONTRACT_COMPLETION': {
          await ReferralService.evaluateContractQualification(payload.contractId);
          return { processed: true, action: 'EVALUATE_CONTRACT_COMPLETION' };
        }

        case 'SWEEP_EXPIRED_RESERVATIONS': {
          const now = new Date();
          const expiredReservations = await prisma.pointReservation.findMany({
            where: {
              status: 'PENDING_CHECKOUT',
              expiresAt: { lte: now },
            },
          });

          for (const res of expiredReservations) {
            await prisma.$transaction([
              prisma.pointWallet.update({
                where: { id: res.walletId },
                data: {
                  lockedPoints: { decrement: res.amount },
                  availablePoints: { increment: res.amount },
                },
              }),
              prisma.pointReservation.update({
                where: { id: res.id },
                data: { status: 'EXPIRED' },
              }),
            ]);
          }
          return { sweptCount: expiredReservations.length };
        }

        default:
          console.warn(`[LoyaltyWorker] Unknown action: ${action}`);
          return { ignored: true };
      }
    },
    {
      connection: redis,
      concurrency: 5,
      limiter: {
        max: 50,
        duration: 1000,
      },
    }
  );

  loyaltyWorkerInstance.on('completed', (job) => {
    console.log(`[LoyaltyWorker] Job ${job.id} completed successfully.`);
  });

  loyaltyWorkerInstance.on('failed', (job, err) => {
    console.error(`[LoyaltyWorker] Job ${job?.id} failed with error:`, err.message);
  });

  return loyaltyWorkerInstance;
}
