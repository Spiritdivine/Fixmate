import prisma from '../config/db.js';
import { ApiError } from '../utils/api-error.js';
import { getIO } from '../sockets/socket.server.js';

export class NotificationService {
  /**
   * Create an in-app notification and emit to real-time socket room
   */
  static async createNotification(userId, title, body, actionUrl = null) {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        body,
        actionUrl,
      },
    });

    try {
      const io = getIO();
      io.to(`user:${userId}`).emit('notification', notification);
    } catch {
      // Socket.io might not be connected in tests or offline users
    }

    return notification;
  }

  /**
   * Fetch paginated notifications for user
   */
  static async getUserNotifications(userId, { page = 1, limit = 20, unreadOnly = false } = {}) {
    const skip = (Number(page) - 1) * Number(limit);
    const where = {
      userId,
      ...(unreadOnly === 'true' || unreadOnly === true ? { isRead: false } : {}),
    };

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      notifications,
      meta: {
        total,
        unreadCount,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  /**
   * Mark single notification as read
   */
  static async markAsRead(userId, notificationId) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== userId) {
      throw ApiError.notFound('Notification not found');
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Mark all user notifications as read
   */
  static async markAllAsRead(userId) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Delete a single notification
   */
  static async deleteNotification(userId, notificationId) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== userId) {
      throw ApiError.notFound('Notification not found');
    }

    return prisma.notification.delete({
      where: { id: notificationId },
    });
  }

  /**
   * Clear all read notifications for user
   */
  static async clearReadNotifications(userId) {
    return prisma.notification.deleteMany({
      where: { userId, isRead: true },
    });
  }
}

export default NotificationService;
