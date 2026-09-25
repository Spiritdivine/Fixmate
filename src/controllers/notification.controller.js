import { NotificationService } from '../services/notification.service.js';
import { ApiResponse } from '../utils/api-response.js';

export class NotificationController {
  static async getNotifications(req, res, next) {
    try {
      const result = await NotificationService.getUserNotifications(req.user.id, req.query);
      res.status(200).json(new ApiResponse(200, result, 'Notifications fetched successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async markAsRead(req, res, next) {
    try {
      const result = await NotificationService.markAsRead(req.user.id, req.params.id);
      res.status(200).json(new ApiResponse(200, result, 'Notification marked as read'));
    } catch (error) {
      next(error);
    }
  }

  static async markAllAsRead(req, res, next) {
    try {
      const result = await NotificationService.markAllAsRead(req.user.id);
      res.status(200).json(new ApiResponse(200, result, 'All notifications marked as read'));
    } catch (error) {
      next(error);
    }
  }

  static async deleteNotification(req, res, next) {
    try {
      await NotificationService.deleteNotification(req.user.id, req.params.id);
      res.status(200).json(new ApiResponse(200, null, 'Notification deleted'));
    } catch (error) {
      next(error);
    }
  }

  static async clearRead(req, res, next) {
    try {
      const result = await NotificationService.clearReadNotifications(req.user.id);
      res.status(200).json(new ApiResponse(200, result, 'Read notifications cleared'));
    } catch (error) {
      next(error);
    }
  }

  static async getVapidPublicKey(req, res, next) {
    try {
      const { PushNotificationService } = await import('../services/pushNotificationService.js');
      const publicKey = PushNotificationService.getPublicKey();
      res.status(200).json(new ApiResponse(200, { publicKey }, 'VAPID public key fetched'));
    } catch (error) {
      next(error);
    }
  }

  static async subscribePush(req, res, next) {
    try {
      const { subscription } = req.body;
      const userAgent = req.headers['user-agent'] || null;
      const { PushNotificationService } = await import('../services/pushNotificationService.js');
      await PushNotificationService.saveSubscription(req.user.id, subscription, userAgent);
      res.status(200).json(new ApiResponse(200, null, 'Push subscription registered successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async unsubscribePush(req, res, next) {
    try {
      const { endpoint } = req.body;
      const { PushNotificationService } = await import('../services/pushNotificationService.js');
      await PushNotificationService.removeSubscription(endpoint);
      res.status(200).json(new ApiResponse(200, null, 'Push subscription removed successfully'));
    } catch (error) {
      next(error);
    }
  }
}

export default NotificationController;

