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
        console.log('🔄 Initializing FCM for Push Notifications...');
        
        const supported = await isFCMSupported();
        setIsSupported(supported);
        
        if (!supported) {
          console.log('🚫 FCM not supported');
          return;
        }

        setPermission(Notification.permission);

        if (Notification.permission === 'granted') {
          const token = await getFCMToken();
          if (token) {
            setFcmToken(token);
            console.log('✅ FCM initialized with token');
            
            // Store token in user's document
            if (user) {
              try {
                const userRef = doc(firestore, 'users', user.uid);
                await updateDoc(userRef, {
                  fcmTokens: arrayUnion(token),
                  notificationEnabled: true,
                  lastFCMUpdate: new Date()
                });
                console.log('✅ FCM token stored in user document');
              } catch (error) {
                console.error('❌ Error storing FCM token:', error);
              }
            }
          }
        }

        // Foreground message listener
        unsubscribe = await onForegroundMessage((payload) => {
          console.log('📱 Foreground FCM message:', payload);
          // Service worker background messages handle karega
        });

      } catch (error) {
        console.error('❌ Error initializing FCM:', error);
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
      if (!('Notification' in window)) {
        console.log('🚫 Notifications not supported');
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
      console.error('❌ Error requesting notification permission:', error);
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
      console.error('❌ Error disabling notifications:', error);
    }
  }, [user]);

  // ✅ SEND PUSH NOTIFICATION TO USER
  const sendPushNotification = useCallback(async (userId: string, title: string, body: string, data?: any) => {
    try {
      // Get user's FCM token from Firestore
      const userRef = doc(firestore, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        console.log('❌ User not found:', userId);
        return false;
      }

      const userData = userSnap.data();
      const userTokens = userData.fcmTokens || [];

      if (userTokens.length === 0) {
        console.log('❌ No FCM tokens found for user:', userId);
        return false;
      }

      // Send to all tokens (handle multiple devices)
      const response = await fetch('/api/send-notification', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokens: userTokens,
          title,
          body,
          data: {
            ...data,
            chatId: data?.chatId,
            senderId: data?.senderId,
            type: 'chat_message',
            timestamp: new Date().toISOString()
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Push notification sent to user:', result);
      
      return result.success;

    } catch (error) {
      console.error('❌ Error sending push notification to user:', error);
      return false;
    }
  }, []);

  // ✅ SEND PUSH NOTIFICATION TO CURRENT TOKEN (Testing)
  const testPushNotification = useCallback(async (title: string, body: string) => {
  if (!fcmToken) {
    console.log('❌ No FCM token available');
    alert('No FCM token available. Please enable notifications first.');
    return false;
  }

  try {
    console.log('🧪 Testing push notification with token:', fcmToken.substring(0, 20) + '...');
    
    const response = await fetch('/api/send-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: fcmToken,
        title,
        body,
        data: {
          type: 'test',
          timestamp: new Date().toISOString(),
          test: true
        }
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('❌ API Error:', result);
      alert(`Error: ${result.error}\n\nCheck console for details.`);
      return false;
    }

    console.log('✅ Test push notification sent:', result);
    alert('✅ Test notification sent! Check your device for push notification.');
    return true;

  } catch (error: any) {
    console.error('❌ Error sending test push notification:', error);
    alert(`Network Error: ${error.message}\n\nCheck if API is deployed properly.`);
    return false;
  }
}, [fcmToken]);

  return {
    fcmToken,
    isFCMSupported: isSupported,
    notificationPermission: permission,
    requestPermission,
    disableNotifications,
    sendPushNotification,
    testPushNotification
  };
};