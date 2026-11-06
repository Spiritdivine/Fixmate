import { Expo } from 'expo-server-sdk';
import prisma from '../config/db.js';

const expo = new Expo();

export class ExpoPushService {
  /**
   * Register or refresh an Expo push token for a user
   */
  static async registerToken(userId, { token, platform = 'ANDROID', deviceId = null, deviceName = null }) {
    if (!token || typeof token !== 'string') {
      throw new Error('Valid push token is required');
    }

    const normalizedPlatform = (platform || '').toUpperCase() === 'IOS' ? 'IOS' : 'ANDROID';

    return prisma.mobileDeviceToken.upsert({
      where: { token },
      update: {
        userId,
        platform: normalizedPlatform,
        deviceId: deviceId || undefined,
        deviceName: deviceName || undefined,
        isActive: true,
        lastSeenAt: new Date(),
      },
      create: {
        userId,
        token,
        platform: normalizedPlatform,
        deviceId: deviceId || undefined,
        deviceName: deviceName || undefined,
        isActive: true,
        lastSeenAt: new Date(),
      },
    });
  }

  /**
   * Deactivate an Expo push token on logout
   */
  static async unregisterToken(userId, token) {
    if (!token) return null;
    return prisma.mobileDeviceToken.updateMany({
      where: {
        token,
        userId,
      },
      data: {
        isActive: false,
      },
    });
  }

  /**
   * Dispatch push notification to all active devices of a user
   */
  static async sendPushToUser(userId, { title, body, data = {}, sound = 'default', badge = 1 }) {
    try {
      const activeTokens = await prisma.mobileDeviceToken.findMany({
        where: {
          userId,
          isActive: true,
        },
      });

      if (!activeTokens || activeTokens.length === 0) {
        return { delivered: 0, reason: 'No active device tokens found' };
      }

      const validTokens = [];
      const invalidTokenIds = [];

      for (const record of activeTokens) {
        if (Expo.isExpoPushToken(record.token)) {
          validTokens.push(record.token);
        } else {
          invalidTokenIds.push(record.id);
        }
      }

      // Cleanup invalid tokens
      if (invalidTokenIds.length > 0) {
        await prisma.mobileDeviceToken.updateMany({
          where: { id: { in: invalidTokenIds } },
          data: { isActive: false },
        });
      }

      if (validTokens.length === 0) {
        return { delivered: 0, reason: 'No valid Expo push tokens found' };
      }

      const messages = validTokens.map((to) => ({
        to,
        sound,
        title,
        body,
        data,
        badge,
        channelId: 'default',
        priority: 'high',
        _displayInForeground: true,
      }));

      const chunks = expo.chunkPushNotifications(messages);
      const deadTokens = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          for (let i = 0; i < ticketChunk.length; i++) {
            const ticket = ticketChunk[i];
            if (ticket.status === 'error') {
              if (ticket.details && ticket.details.error === 'DeviceNotRegistered') {
                deadTokens.push(chunk[i].to);
              }
            }
          }
        } catch (chunkError) {
          console.warn('[ExpoPush] Chunk send error:', chunkError.message);
        }
      }

      if (deadTokens.length > 0) {
        await prisma.mobileDeviceToken.updateMany({
          where: { token: { in: deadTokens } },
          data: { isActive: false },
        });
      }

      return { delivered: validTokens.length - deadTokens.length };
    } catch (error) {
      console.warn('[ExpoPush] Unexpected dispatch error:', error.message);
      return { delivered: 0, error: error.message };
    }
  }
}
