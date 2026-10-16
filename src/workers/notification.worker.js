import { Worker } from 'bullmq';
import { redis, cacheStore } from '../config/redis.js';
import { QUEUE_NAMES } from '../queues/queue.manager.js';
import prisma from '../config/db.js';
import webpush from 'web-push';

let workerInstance = null;

export function initNotificationWorker() {
  if (!cacheStore.isRedisActive() || !redis) {
    console.log('[Worker] Redis not active. Notification worker running in standalone fallback mode.');
    return null;
  }

  workerInstance = new Worker(
    QUEUE_NAMES.NOTIFICATIONS,
    async (job) => {
      const { userId, title, message, body, actionUrl, payload } = job.data;
      const notificationText = message || body || '';

      // 1. Persist notification in database
      const notification = await prisma.notification.create({
        data: {
          userId,
          title,
          body: notificationText,
          actionUrl: actionUrl || null,
        },
      });

      // 2. Fetch push subscriptions
      const subscriptions = await prisma.pushSubscription.findMany({
        where: { userId },
      });

      // 3. Dispatch web push concurrently
      const pushResults = await Promise.allSettled(
        subscriptions.map((sub) =>
          webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            JSON.stringify({
              title,
              body: notificationText,
              actionUrl,
              payload,
            })
          )
        )
      );

      const successfulPushes = pushResults.filter((r) => r.status === 'fulfilled').length;
      return {
        processed: true,
        notificationId: notification.id,
        subscriptionsTargeted: subscriptions.length,
        successfulPushes,
      };
    },
    {
      connection: redis,
      concurrency: 10,
    }
  );

  workerInstance.on('completed', (job, returnvalue) => {
    console.log(`[Worker] Notification job ${job.id} completed successfully (pushed to ${returnvalue.successfulPushes} devices)`);
  });

  workerInstance.on('failed', (job, err) => {
    console.error(`[Worker] Notification job ${job.id} failed:`, err.message);
  });

  return workerInstance;
}

// Auto-run if executed as standalone script
if (process.argv[1] && process.argv[1].endsWith('notification.worker.js')) {
  console.log('🚀 Launching Standalone Notification Worker Process...');
  initNotificationWorker();

  const shutdown = async () => {
    console.log('\n🛑 Shutting down Notification Worker...');
    if (workerInstance) {
      await workerInstance.close();
    }
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

export default initNotificationWorker;
