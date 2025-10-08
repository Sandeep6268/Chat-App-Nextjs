'use client';

import { useEffect, useCallback, useState } from 'react';
import { getFCMToken, onForegroundMessage, isFCMSupported, deleteFCMToken } from '@/lib/firebase-messaging';
import { doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { useAuth } from '@/components/auth/AuthProvider';

export const useNotifications = () => {
  const { user } = useAuth();
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  // Initialize FCM
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initializeFCM = async () => {
      try {
        console.log('🔄 [NOTIFICATIONS] Initializing FCM...');
        
        const supported = await isFCMSupported();
        setIsSupported(supported);
        
        if (!supported) {
          console.log('🚫 [NOTIFICATIONS] FCM not supported');
          return;
        }

        setPermission(Notification.permission);

        // Get FCM token
        const token = await getFCMToken();
        if (token) {
          setFcmToken(token);
          console.log('✅ [NOTIFICATIONS] FCM token received');
          
          // Store token in user's document
          if (user) {
            try {
              const userRef = doc(firestore, 'users', user.uid);
              await updateDoc(userRef, {
                fcmTokens: arrayUnion(token),
                notificationEnabled: true,
                lastFCMUpdate: new Date()
              });
              console.log('💾 [NOTIFICATIONS] FCM token stored');
            } catch (error) {
              console.error('❌ [NOTIFICATIONS] Error storing FCM token:', error);
            }
          }
        }

        // Foreground message listener
        unsubscribe = await onForegroundMessage((payload) => {
          console.log('📱 [NOTIFICATIONS] Foreground message:', payload);
        });

      } catch (error) {
        console.error('❌ [NOTIFICATIONS] Error initializing FCM:', error);
      }
    };

    initializeFCM();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  // Request Permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🔔 [NOTIFICATIONS] Requesting permission...');
      
      if (!('Notification' in window)) {
        return false;
      }

      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        const token = await getFCMToken();
        if (token) {
          setFcmToken(token);
          return true;
        }
      }
      
      return result === 'granted';
    } catch (error) {
      console.error('❌ [NOTIFICATIONS] Error requesting permission:', error);
      return false;
    }
  }, []);

  // Disable Notifications
  const disableNotifications = useCallback(async () => {
    try {
      await deleteFCMToken();
      setFcmToken(null);
      
      if (user) {
        const userRef = doc(firestore, 'users', user.uid);
        await updateDoc(userRef, {
          notificationEnabled: false
        });
      }
    } catch (error) {
      console.error('❌ [NOTIFICATIONS] Error disabling notifications:', error);
    }
  }, [user]);

  // ✅ FIXED: Send Push Notification - SIMPLIFIED & RELIABLE
  const sendPushNotification = useCallback(async (userId: string, title: string, body: string, data?: any) => {
    try {
      console.log('🚀 [NOTIFICATIONS] Sending push to:', userId);

      // Get user's FCM tokens
      const userRef = doc(firestore, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        console.log('❌ [NOTIFICATIONS] User not found');
        return false;
      }

      const userData = userSnap.data();
      const userTokens = userData.fcmTokens || [];

      console.log(`📋 [NOTIFICATIONS] User has ${userTokens.length} tokens`);

      if (userTokens.length === 0) {
        console.log('❌ [NOTIFICATIONS] No FCM tokens found');
        return false;
      }

      // Send to first token
      const token = userTokens[0];
      
      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token,
          title: title,
          body: body,
          data: data || {}
        }),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        console.log('✅ [NOTIFICATIONS] Push sent successfully!');
        return true;
      } else {
        console.error('❌ [NOTIFICATIONS] Push failed:', result.error);
        return false;
      }

    } catch (error) {
      console.error('❌ [NOTIFICATIONS] Error sending push:', error);
      return false;
    }
  }, []);

  // ✅ FIXED: Test Push Notification - ALWAYS WORKS
  const testPushNotification = useCallback(async (title: string, body: string) => {
    console.log('🧪 [NOTIFICATIONS] Starting test...');

    // 1. First show browser notification (ALWAYS WORKS)
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(
        title || 'Test Notification 🔔',
        {
          body: body || 'This is a test browser notification!',
          icon: '/icon-192.png' ,
          badge: '/badge.png',
          tag: `test-${Date.now()}`,
        }
      );

      notification.onclick = () => {
        notification.close();
      };
      console.log('✅ [NOTIFICATIONS] Browser notification shown');
    }

    // 2. Then try FCM push notification
    const currentToken = localStorage.getItem('fcmToken');
    
    if (!currentToken) {
      alert('Browser notification shown! But no FCM token.');
      return false;
    }

    try {
      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: currentToken,
          title: title || 'Test Push 🔔',
          body: body || 'This is a test push notification!',
          data: { type: 'test', timestamp: new Date().toISOString() }
        }),
      });

      const result = await response.json();
    
      if (response.ok && result.success) {
        console.log('🎉 [NOTIFICATIONS] FCM test sent!');
        alert('✅ Both notifications sent! Check your device.');
        return true;
      } else {
        alert(`Browser notification shown! But FCM failed: ${result.error}`);
        return false;
      }

    } catch (error: any) {
      alert('Browser notification shown! But FCM network error.');
      return false;
    }
  }, []);

  // ✅ NEW: Simple Browser Notification for unread counts
  const showBrowserNotification = useCallback((title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted' && !document.hasFocus()) {
      const notification = new Notification(title, {
        body: body,
        icon: '/icon-192.png',
        badge: '/badge.png',
        tag: `browser-${Date.now()}`,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
      
      console.log('✅ [NOTIFICATIONS] Browser notification shown');
      return true;
    }
    return false;
  }, []);

  return {
    fcmToken,
    isFCMSupported: isSupported,
    notificationPermission: permission,
    requestPermission,
    disableNotifications,
    sendPushNotification,
    testPushNotification,
    showBrowserNotification
  };
};