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

// hooks/useNotifications.ts - Updated sendPushNotification function
const sendPushNotification = useCallback(async (userId: string, title: string, body: string, data?: any) => {
  try {
    console.log('🚀 [NOTIFICATIONS] Sending push to user:', userId);

    // Get user's document
    const userRef = doc(firestore, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      console.log('❌ [NOTIFICATIONS] User not found');
      return false;
    }

    const userData = userSnap.data();
    const userTokens = userData.fcmTokens || [];

    console.log(`📋 [NOTIFICATIONS] User has ${userTokens.length} token(s)`);

    if (userTokens.length === 0) {
      console.log('❌ [NOTIFICATIONS] No FCM tokens found for user');
      return false;
    }

    let success = false;
    const expiredTokens: string[] = [];

    // Try each token
    for (const token of userTokens) {
      try {
        console.log('📤 [NOTIFICATIONS] Attempting send to token:', token.substring(0, 20) + '...');
        
        const response = await fetch('/api/send-notification', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: token.trim(),
            title: title,
            body: body,
            data: data || {}
          }),
        });

        const result = await response.json();
        
        if (response.ok && result.success) {
          console.log('✅ [NOTIFICATIONS] Push sent successfully!');
          success = true;
          break; // Stop after first successful send
        } else {
          console.log('❌ [NOTIFICATIONS] Push failed:', result.error);
          
          // Check if token is expired
          if (result.code === 'messaging/registration-token-not-registered' || 
              response.status === 410) {
            console.log('🔄 [NOTIFICATIONS] Token expired, marking for removal');
            expiredTokens.push(token);
          }
          continue;
        }
      } catch (error) {
        console.log('❌ [NOTIFICATIONS] Network error with token:', error);
        continue;
      }
    }

    // Remove expired tokens from user's document
    if (expiredTokens.length > 0) {
      console.log(`🗑️ [NOTIFICATIONS] Removing ${expiredTokens.length} expired tokens`);
      await updateDoc(userRef, {
        fcmTokens: userTokens.filter((t: string) => !expiredTokens.includes(t))
      });
    }

    return success;

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