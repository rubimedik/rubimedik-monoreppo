import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { notificationService } from '../services/notificationService';
import { useAuthStore } from '../store/useAuthStore';
import { navigationRef } from '../navigation/RootNavigator';

export const useNotifications = (navigation: any) => {
  const { user } = useAuthStore();
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  useEffect(() => {
    // Only register if user is logged in
    if (user) {
      notificationService.registerForPushNotificationsAsync();
    }

    // This listener is fired whenever a notification is received while the app is foregrounded
    notificationListener.current = notificationService.addNotificationReceivedListener(notification => {
      console.log('Notification received in foreground:', notification);
    });

    // This listener is fired whenever a user taps on or interacts with a notification 
    // (works when app is foregrounded, backgrounded, or killed)
    responseListener.current = notificationService.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      console.log('Notification interaction:', data);

      if (data.type) {
        handleNotificationNavigation(data);
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationService.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        notificationService.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [user]);

  const handleNotificationNavigation = (data: any) => {
    if (!navigationRef.isReady()) {
        console.log('Navigation ref not ready, retrying in 500ms...');
        setTimeout(() => handleNotificationNavigation(data), 500);
        return;
    }

    switch (data.type) {
      case 'CHAT_MESSAGE':
        navigationRef.navigate('Chat' as any, { 
            roomId: data.chatId,
            otherUserName: data.senderName || 'User'
        } as any);
        break;
      case 'CONSULTATION_UPDATE':
        navigationRef.navigate('ConsultationDetail' as any, { consultationId: data.consultationId } as any);
        break;
      case 'WALLET_TRANSACTION':
        navigationRef.navigate('Wallet' as any);
        break;
      case 'BLOOD_REQUEST':
        navigationRef.navigate('DonationDetails' as any, { id: data.requestId } as any);
        break;
      default:
        // navigationRef.navigate('Notifications' as never);
        break;
    }
  };

  return null;
};
