import { Queue } from 'bullmq';
import { redis, cacheStore } from '../config/redis.js';
import prisma from '../config/db.js';
import webpush from 'web-push';

export const QUEUE_NAMES = {
  NOTIFICATIONS: 'artisan:notifications',
  MEDIA_PROCESSING: 'artisan:media_processing',
  BLOCKCHAIN_TRANSACTIONS: 'artisan:blockchain_tx',
  LOYALTY_POINTS: 'artisan:loyalty_points',
};

const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 1000,
  },
  removeOnComplete: 100,
  removeOnFail: 500,
};

let notificationQueueInstance = null;
let mediaQueueInstance = null;
let loyaltyQueueInstance = null;

if (cacheStore.isRedisActive() && redis) {
  try {
    notificationQueueInstance = new Queue(QUEUE_NAMES.NOTIFICATIONS, {
      connection: redis,
      defaultJobOptions,
    });

    mediaQueueInstance = new Queue(QUEUE_NAMES.MEDIA_PROCESSING, {
      connection: redis,
      defaultJobOptions,
    });

    loyaltyQueueInstance = new Queue(QUEUE_NAMES.LOYALTY_POINTS, {
      connection: redis,
      defaultJobOptions,
    });
    console.log('✅ BullMQ queues initialized with Redis backend');
  } catch (err) {
    console.warn('[BullMQ] Could not initialize Redis queue, falling back to direct handler:', err.message);
  }
}

/**
 * High-performance notification dispatch that pushes to BullMQ when available,
 * or handles in background without blocking the HTTP caller.
 */
export async function enqueueNotification(data) {
  const { userId, title, message, actionUrl, payload, type } = data;

  if (notificationQueueInstance) {
    try {
      return await notificationQueueInstance.add('send_notification', data);
    } catch (err) {
      console.warn('[Queue] Failed to enqueue notification to Redis, using direct handler:', err.message);
    }
  }

  // Graceful direct execution fallback (non-blocking)
  setImmediate(async () => {
    try {
      // 1. Persist notification in database
      await prisma.notification.create({
        data: {
          userId,
          title,
          body: message || data.body || '',
          actionUrl: actionUrl || null,
        },
      });

      // 2. Fetch active WebPush subscriptions
      const subscriptions = await prisma.pushSubscription.findMany({
        where: { userId },
      });

      // 3. Dispatch web push concurrently
      await Promise.allSettled(
        subscriptions.map((sub) => {
          try {
            return webpush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth },
              },
              JSON.stringify({ title, body: message || data.body, payload })
            );
          } catch (e) {
            return Promise.resolve();
          }
        })
      );
    } catch (err) {
      console.warn('[Notification Direct Fallback] Error persisting notification:', err.message);
    }
  });

  return { id: `local-${Date.now()}`, data };
}

/**
 * Enqueues a loyalty point or referral event to BullMQ, or falls back to async background execution.
 */
export async function enqueueLoyaltyEvent(data) {
  if (loyaltyQueueInstance) {
    try {
      return await loyaltyQueueInstance.add('loyalty_event', data);
    } catch (err) {
      console.warn('[Queue] Failed to enqueue loyalty event to Redis, executing directly:', err.message);
    }
  }

  // Graceful direct execution fallback (non-blocking)
  setImmediate(async () => {
    try {
      const { ReferralService } = await import('../services/referral.service.js');
      const { action, payload } = data;
      if (action === 'EVALUATE_CONTRACT_COMPLETION') {
        await ReferralService.evaluateContractQualification(payload.contractId);
      }
    } catch (err) {
      console.warn('[Loyalty Direct Fallback] Error processing loyalty event:', err.message);
    }
  });

  return { id: `local-loyalty-${Date.now()}`, data };
}

export const notificationQueue = notificationQueueInstance;
export const mediaQueue = mediaQueueInstance;
export const loyaltyQueue = loyaltyQueueInstance;
export default {
  notificationQueue,
  mediaQueue,
  loyaltyQueue,
  enqueueNotification,
  enqueueLoyaltyEvent,
  QUEUE_NAMES,
};

