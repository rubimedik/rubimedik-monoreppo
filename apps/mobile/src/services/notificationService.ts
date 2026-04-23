import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { api } from './api';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const notificationService = {
  /**
   * Register for push notifications and send token to backend
   */
  async registerForPushNotificationsAsync() {
    let token;
    console.log('--- Push Registration Started ---');

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    // Allow Android emulators for testing, but still require physical device for iOS
    const canRegister = Device.isDevice || Platform.OS === 'android';

    if (canRegister) {
      console.log('Checking permissions...');
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.warn('Permission not granted for push notifications');
        return null;
      }

      // Project ID from env, app.json / EAS
      const projectId = 
        process.env.EXPO_PUBLIC_PROJECT_ID ??
        Constants.expoConfig?.extra?.eas?.projectId ?? 
        Constants.easConfig?.projectId;
        
      console.log('Push Registration Debug:', { isDevice: Device.isDevice, projectId });

      try {
        if (Platform.OS === 'android') {
          console.log('Requesting Direct Device Push Token (Android)...');
          const deviceTokenResponse = await Notifications.getDevicePushTokenAsync();
          token = deviceTokenResponse.data;
        } else {
          console.log('Requesting Expo Push Token (iOS/Web)...');
          const tokenResponse = await Notifications.getExpoPushTokenAsync({
            projectId,
          });
          token = tokenResponse.data;
        }
        
        console.log('==========================================');
        console.log(`${Platform.OS.toUpperCase()} PUSH TOKEN:`, token);
        console.log('==========================================');

        // Send to backend
        await api.post('/notifications/register-token', {
          token,
          platform: Platform.OS,
        });

        return token;
      } catch (error: any) {
        console.log('--- PUSH ERROR DETAILS ---');
        console.log('Message:', error.message);
        console.log('Code:', error.code);
        console.log('--------------------------');
        console.warn('Push notification registration skipped:', error.message);
        return null;
      }
    } else {
      console.log('Must use physical device for Push Notifications');
      return null;
    }
  },

  /**
   * Add listener for when a notification is received while the app is foregrounded
   */
  addNotificationReceivedListener(callback: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(callback);
  },

  /**
   * Add listener for when a user interacts with a notification (taps it)
   */
  addNotificationResponseReceivedListener(callback: (response: Notifications.NotificationResponse) => void) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  },

  /**
   * Remove a specific notification listener
   */
  removeNotificationSubscription(subscription: any) {
    if (subscription && subscription.remove) {
      subscription.remove();
    }
  },

  /**
   * Get all unread notifications from backend
   */
  async getMyNotifications() {
    const res = await api.get('/notifications');
    return res.data;
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(id: string) {
    await api.put(`/notifications/${id}/read`);
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    await api.post('/notifications/read-all');
  }
};
