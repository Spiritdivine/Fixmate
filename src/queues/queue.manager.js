import { Queue } from 'bullmq';
import { redis, cacheStore } from '../config/redis.js';
import prisma from '../config/db.js';
import webpush from 'web-push';

export const QUEUE_NAMES = {
  NOTIFICATIONS: 'artisan:notifications',
  MEDIA_PROCESSING: 'artisan:media_processing',
  BLOCKCHAIN_TRANSACTIONS: 'artisan:blockchain_tx',
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

export const notificationQueue = notificationQueueInstance;
export const mediaQueue = mediaQueueInstance;
export default {
  notificationQueue,
  mediaQueue,
  enqueueNotification,
  QUEUE_NAMES,
};
