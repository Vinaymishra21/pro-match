import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { registerPushToken } from './apiService';

// Show notifications while the app is foregrounded too.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false
  })
});

// Requests permission, gets the Expo push token, and registers it with the
// backend. Safe to call on every login — it no-ops on simulators/denied perms.
export async function registerForPushNotifications(authToken: string): Promise<void> {
  try {
    if (!Device.isDevice) {
      // Push tokens are only issued on physical devices.
      return;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX
      });
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;
    if (existing !== 'granted') {
      const req = await Notifications.requestPermissionsAsync();
      status = req.status;
    }
    if (status !== 'granted') {
      return;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync();
    if (tokenData?.data) {
      await registerPushToken(tokenData.data, authToken);
    }
  } catch (error) {
    // Never let push setup break the login flow.
    console.warn('Push registration failed:', (error as Error).message);
  }
}
