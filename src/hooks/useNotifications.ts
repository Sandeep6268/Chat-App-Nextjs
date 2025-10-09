import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { requestNotificationPermission, onForegroundMessage } from '@/lib/firebase/client';
import { NotificationService } from '@/lib/notifications';

export const useNotifications = () => {
  const { user } = useAuth();
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  // Request notification permission and get FCM token
  const initializeNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const token = await requestNotificationPermission();
      setFcmToken(token);
      setPermission(Notification.permission);

      if (token) {
        await NotificationService.saveUserFCMToken(user.uid, token);
        console.log('✅ FCM token saved for user:', user.uid);
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  }, [user]);

  // Handle foreground messages
  useEffect(() => {
    if (!user) return;

    const unsubscribe = onForegroundMessage((payload) => {
      console.log('📨 Received foreground message:', payload);
      
      // Show notification even in foreground if needed
      if (payload.notification) {
        const { title, body } = payload.notification;
        new Notification(title || 'New Message', {
          body,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
        });
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Clean up FCM token on unmount
  useEffect(() => {
    return () => {
      if (user && fcmToken) {
        NotificationService.removeUserFCMToken(user.uid, fcmToken);
      }
    };
  }, [user, fcmToken]);

  return {
    fcmToken,
    permission,
    initializeNotifications,
    hasPermission: permission === 'granted',
  };
};