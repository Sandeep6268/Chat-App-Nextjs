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

  // Initialize FCM with better error handling
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initializeFCM = async () => {
      try {
        console.log('🔄 [NOTIFICATIONS] Initializing FCM...');
        
        const supported = await isFCMSupported();
        setIsSupported(supported);
        
        if (!supported) {
          console.log('🚫 [NOTIFICATIONS] FCM not supported in this browser');
          return;
        }

        console.log('✅ [NOTIFICATIONS] FCM supported');
        setPermission(Notification.permission);

        // Always try to get token, even if permission is not granted yet
        console.log('🔑 [NOTIFICATIONS] Getting FCM token...');
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
              console.log('💾 [NOTIFICATIONS] FCM token stored in user document');
            } catch (error) {
              console.error('❌ [NOTIFICATIONS] Error storing FCM token:', error);
            }
          }
        } else {
          console.log('❌ [NOTIFICATIONS] Failed to get FCM token - might need permission');
        }

        // Set up foreground message listener
        unsubscribe = await onForegroundMessage((payload) => {
          console.log('📱 [NOTIFICATIONS] Foreground FCM message received:', payload);
        });

        console.log('🎉 [NOTIFICATIONS] FCM initialization completed');

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

  // Request Permission with better handling
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🔔 [NOTIFICATIONS] Requesting notification permission...');
      
      if (!('Notification' in window)) {
        console.log('🚫 [NOTIFICATIONS] Notifications not supported');
        return false;
      }

      const result = await Notification.requestPermission();
      setPermission(result);
      console.log(`📋 [NOTIFICATIONS] Permission result: ${result}`);
      
      if (result === 'granted') {
        console.log('✅ [NOTIFICATIONS] Permission granted');
        
        // Get new token after permission granted
        const token = await getFCMToken();
        if (token) {
          setFcmToken(token);
          console.log('🎉 [NOTIFICATIONS] New FCM token generated');
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
      console.log('🔕 [NOTIFICATIONS] Disabling notifications...');
      await deleteFCMToken();
      setFcmToken(null);
      
      if (user) {
        const userRef = doc(firestore, 'users', user.uid);
        await updateDoc(userRef, {
          notificationEnabled: false
        });
      }
      console.log('✅ [NOTIFICATIONS] Notifications disabled');
    } catch (error) {
      console.error('❌ [NOTIFICATIONS] Error disabling notifications:', error);
    }
  }, [user]);

  // ✅ IMPROVED: Send Push Notification with Fallback
  const sendPushNotification = useCallback(async (userId: string, title: string, body: string, data?: any) => {
    try {
      console.log('🚀 [NOTIFICATIONS] Sending push notification to user:', userId);

      // Get user's FCM token from Firestore
      const userRef = doc(firestore, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        console.log('❌ [NOTIFICATIONS] User not found');
        return false;
      }

      const userData = userSnap.data();
      const userTokens = userData.fcmTokens || [];

      console.log(`📋 [NOTIFICATIONS] User has ${userTokens.length} FCM tokens`);

      if (userTokens.length === 0) {
        console.log('❌ [NOTIFICATIONS] No FCM tokens found for user');
        return false;
      }

      // Try to send to each token until one works
      for (const token of userTokens) {
        try {
          console.log('📤 [NOTIFICATIONS] Sending to token:', token.substring(0, 20) + '...');
          
          const response = await fetch('/api/send-notification', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              token: token,
              title: title.substring(0, 50), // Limit title length
              body: body.substring(0, 150), // Limit body length
              data: {
                ...data,
                type: 'chat_message',
                timestamp: new Date().toISOString()
              }
            }),
          });

          const result = await response.json();
          
          if (response.ok && result.success) {
            console.log('✅ [NOTIFICATIONS] Push notification sent successfully!');
            return true;
          } else {
            console.log('❌ [NOTIFICATIONS] Token failed, trying next...', result.error);
            continue; // Try next token
          }
        } catch (error) {
          console.log('❌ [NOTIFICATIONS] Error with token, trying next...', error);
          continue;
        }
      }

      console.log('❌ [NOTIFICATIONS] All tokens failed');
      return false;

    } catch (error) {
      console.error('❌ [NOTIFICATIONS] Error sending push notification:', error);
      return false;
    }
  }, []);

  // ✅ FIXED: Test Push Notification - ALWAYS shows browser notification
  const testPushNotification = useCallback(async (title: string, body: string) => {
    console.log('🧪 [NOTIFICATIONS] Starting test notification...');

    // First, always try to show browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      console.log('📱 [NOTIFICATIONS] Showing browser notification...');
      
      const notification = new Notification(
        title || 'Test Notification 🔔',
        {
          body: body || 'This is a test browser notification!',
          icon: '/icon-192.png',
          badge: '/badge.png',
          tag: `test-${Date.now()}`, // Unique tag for each notification
          requireInteraction: true,
        }
      );

      notification.onclick = () => {
        console.log('✅ [NOTIFICATIONS] Test notification clicked');
        notification.close();
      };

      console.log('✅ [NOTIFICATIONS] Browser notification shown');
    } else {
      console.log('❌ [NOTIFICATIONS] Cannot show browser notification - permission not granted');
    }

    // Then try to send FCM push notification
    const currentToken = localStorage.getItem('fcmToken');
    
    if (!currentToken) {
      console.log('❌ [NOTIFICATIONS] No FCM token available');
      alert('Browser notification shown! But no FCM token available for push.');
      return false;
    }

    try {
      console.log('📤 [NOTIFICATIONS] Sending FCM test notification...');
      
      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: currentToken,
          title: title || 'Test Push Notification 🔔',
          body: body || 'This is a test push notification! Check if this arrives on your device.',
          data: {
            type: 'test',
            timestamp: new Date().toISOString(),
            test: true
          }
        }),
      });

      const result = await response.json();
      console.log('📄 [NOTIFICATIONS] FCM Response:', result);
    
      if (response.ok && result.success) {
        console.log('🎉 [NOTIFICATIONS] FCM test notification sent!');
        alert('✅ Both browser and FCM notifications sent! Check your device.');
        return true;
      } else {
        console.error('❌ [NOTIFICATIONS] FCM test failed:', result.error);
        alert(`Browser notification shown! But FCM failed: ${result.error}`);
        return false;
      }

    } catch (error: any) {
      console.error('❌ [NOTIFICATIONS] FCM network error:', error);
      alert('Browser notification shown! But FCM network error occurred.');
      return false;
    }
  }, []);

  // ✅ NEW: Simple Browser Notification (for unread counts, etc.)
  const showBrowserNotification = useCallback((title: string, body: string, tag?: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      console.log('📱 [NOTIFICATIONS] Showing browser notification:', { title, body });
      
      const notification = new Notification(title, {
        body: body,
        icon: '/icon-192.png',
        badge: '/badge.png',
        tag: tag || `notification-${Date.now()}`,
        requireInteraction: false,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

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
    showBrowserNotification // Add this new function
  };
};