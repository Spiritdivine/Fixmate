import { apiClient } from '../lib/api-client';
import { ApiResponse } from '../types/api-contracts';
import { AppNotification } from '../types/notification-contracts';

/**
 * NotificationService (SRP):
 * Manages push notifications, read states, and push token registrations.
 */
export class NotificationService {
  static async getNotifications(page = 1, limit = 30): Promise<AppNotification[]> {
    const response = await apiClient.get<ApiResponse<any>>('/notifications', {
      params: { page, limit },
    });
    const payload = response.data?.data;
    if (Array.isArray(payload)) {
      return payload;
    }
    if (payload && Array.isArray(payload.notifications)) {
      return payload.notifications;
    }
    return [];
  }

  static async markAsRead(notificationId: string): Promise<void> {
    await apiClient.patch(`/notifications/${notificationId}/read`);
  }

  static async markAllAsRead(): Promise<void> {
    await apiClient.patch('/notifications/read-all');
  }

  static async registerPushToken(token: string, devicePlatform: 'ios' | 'android'): Promise<void> {
    await apiClient.post('/notifications/register-token', {
      pushToken: token,
      platform: devicePlatform,
    });
  }
}
