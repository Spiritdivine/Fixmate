import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { NotificationService } from '../services/notification.service';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export class PushNotificationManager {
  static async registerDevice(): Promise<string | null> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') return null;

      const tokenData = await Notifications.getExpoPushTokenAsync();
      const token = tokenData.data;

      if (token) {
        await NotificationService.registerPushToken(
          token,
          Platform.OS === 'ios' ? 'ios' : 'android'
        );
      }

      return token;
    } catch {
      return null;
    }
  }
}
