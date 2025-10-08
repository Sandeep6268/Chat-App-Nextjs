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
  // Get current token from localStorage
  let currentToken = localStorage.getItem('fcmToken');
  
  if (!currentToken) {
    console.log('❌ No FCM token found in localStorage');
    alert('No FCM token available. Please enable notifications first.');
    return false;
  }

  console.log('🧪 Testing with token:', currentToken.substring(0, 30) + '...');

  try {
    const response = await fetch('/api/send-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: currentToken,
        title: title || 'Test Notification',
        body: body || 'This is a test push notification!',
      }),
    });

    const result = await response.json();
    
    console.log('📩 API Response:', result);

    if (!response.ok) {
      // If token is invalid, try to refresh it
      if (result.code === 'messaging/invalid-argument' || 
          result.code === 'messaging/invalid-registration-token') {
        
        console.log('🔄 Token invalid, attempting to refresh...');
        
        // Delete old token and get new one
        localStorage.removeItem('fcmToken');
        const newToken = await getFCMToken();
        
        if (newToken) {
          console.log('✅ Got new token:', newToken.substring(0, 30) + '...');
          alert('Token was expired. New token generated. Please try again.');
          return false;
        } else {
          alert('Token expired and failed to generate new one. Please refresh the page and enable notifications again.');
          return false;
        }
      }
      
      alert(`Error: ${result.error}\n\nCode: ${result.code}`);
      return false;
    }

    if (result.success) {
      console.log('✅ Test push notification sent successfully!');
      alert('✅ Test notification sent! Check your device.');
      return true;
    } else {
      alert(`Error: ${result.error}`);
      return false;
    }

  } catch (error: any) {
    console.error('❌ Network error:', error);
    alert(`Network Error: ${error.message}`);
    return false;
  }
}, []);

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