import webpush from 'web-push';
import prisma from '../config/db.js';

const VAPID_PUBLIC_KEY =
  process.env.VAPID_PUBLIC_KEY ||
  'BNuMJuYdTIowt6MPoT6TLM1rdw4pIH2tWE3pc51nJp4x7n659lJdy-Q_jNHwDCCw5o_CNLdt73UfEc1-V82KCgk';
const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY || 'K0htDAdcK396sUvhmoSydYa16UJHqb2PQY-yvhtVJJU';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@artifix.app';

try {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} catch (err) {
  console.warn('[WebPush] VAPID configuration warning:', err.message);
}

export class PushNotificationService {
  /**
   * Return the public VAPID key so frontend can convert to Uint8Array for PushManager
   */
  static getPublicKey() {
    return VAPID_PUBLIC_KEY;
  }

  /**
   * Register or update a browser push subscription for a user
   */
  static async saveSubscription(userId, subscription, userAgent = null) {
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      throw new Error('Invalid push subscription payload');
    }

    const { endpoint, keys } = subscription;
    const { p256dh, auth } = keys;

    return prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        userId,
        p256dh,
        auth,
        userAgent,
        updatedAt: new Date(),
      },
      create: {
        userId,
        endpoint,
        p256dh,
        auth,
        userAgent,
      },
    });
  }

  /**
   * Remove a push subscription when user toggles off or logs out
   */
  static async removeSubscription(endpoint) {
    if (!endpoint) return null;
    return prisma.pushSubscription
      .delete({
        where: { endpoint },
      })
      .catch(() => null);
  }

  /**
   * Dispatch a Web Push notification to all active device subscriptions of a user
   */
  static async sendPushToUser(userId, { title, body, actionUrl = '/', data = {} }) {
    try {
      const subscriptions = await prisma.pushSubscription.findMany({
        where: { userId },
      });

      if (!subscriptions || subscriptions.length === 0) {
        return { sent: 0, failed: 0 };
      }

      const payload = JSON.stringify({
        title,
        body,
        icon: '/brand/artifix-icon-192.png',
        badge: '/brand/artifix-icon-192.png',
        actionUrl,
        data: {
          url: actionUrl,
          ...data,
        },
      });

      let sent = 0;
      let failed = 0;

      const pushPromises = subscriptions.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        try {
          await webpush.sendNotification(pushSubscription, payload);
          sent++;
        } catch (err) {
          failed++;
          // 410 Gone or 404 Not Found indicates device unregistered or revoked permission
          if (err.statusCode === 410 || err.statusCode === 404) {
            await prisma.pushSubscription.delete({ where: { endpoint: sub.endpoint } }).catch(() => {});
          }
        }
      });

      await Promise.allSettled(pushPromises);
      return { sent, failed };
    } catch (error) {
      console.error('[WebPush] Error dispatching push notification to user:', userId, error);
      return { sent: 0, failed: 0, error: error.message };
    }
  }
}

export default PushNotificationService;
