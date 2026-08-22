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
}

export default NotificationController;
