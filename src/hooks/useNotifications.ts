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

  // Initialize FCM with detailed logging
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

        console.log('✅ [NOTIFICATIONS] FCM supported, checking permission...');
        setPermission(Notification.permission);

        if (Notification.permission === 'granted') {
          console.log('🔑 [NOTIFICATIONS] Permission granted, getting FCM token...');
          const token = await getFCMToken();
          if (token) {
            setFcmToken(token);
            console.log('✅ [NOTIFICATIONS] FCM token received:', token.substring(0, 20) + '...');
            
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
            console.log('❌ [NOTIFICATIONS] Failed to get FCM token');
          }
        } else {
          console.log('ℹ️ [NOTIFICATIONS] Notification permission:', Notification.permission);
        }

        // Set up foreground message listener with detailed logging
        unsubscribe = await onForegroundMessage((payload) => {
          console.log('📱 [NOTIFICATIONS] Foreground FCM message received:', {
            notification: payload.notification,
            data: payload.data,
            from: payload.from,
            messageId: payload.messageId
          });
        });

        console.log('🎉 [NOTIFICATIONS] FCM initialization completed successfully');

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

  // Request Permission with logging
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🔔 [NOTIFICATIONS] Requesting notification permission...');
      
      if (!('Notification' in window)) {
        console.log('🚫 [NOTIFICATIONS] Notifications not supported in this browser');
        return false;
      }

      const result = await Notification.requestPermission();
      setPermission(result);
      console.log(`📋 [NOTIFICATIONS] Permission result: ${result}`);
      
      if (result === 'granted') {
        console.log('✅ [NOTIFICATIONS] Permission granted, getting FCM token...');
        const token = await getFCMToken();
        if (token) {
          setFcmToken(token);
          console.log('🎉 [NOTIFICATIONS] FCM token generated after permission');
          return true;
        }
      }
      
      return result === 'granted';
    } catch (error) {
      console.error('❌ [NOTIFICATIONS] Error requesting notification permission:', error);
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

  // ✅ SEND PUSH NOTIFICATION TO USER - WITH DETAILED LOGGING
  const sendPushNotification = useCallback(async (userId: string, title: string, body: string, data?: any) => {
    try {
      console.log('🚀 [NOTIFICATIONS] Sending push notification:', {
        toUserId: userId,
        title,
        body,
        data
      });

      // Get user's FCM token from Firestore
      const userRef = doc(firestore, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        console.log('❌ [NOTIFICATIONS] User not found:', userId);
        return false;
      }

      const userData = userSnap.data();
      const userTokens = userData.fcmTokens || [];

      console.log(`📋 [NOTIFICATIONS] User ${userId} has ${userTokens.length} FCM tokens`);

      if (userTokens.length === 0) {
        console.log('❌ [NOTIFICATIONS] No FCM tokens found for user:', userId);
        return false;
      }

      // Log each token (first few characters for privacy)
      userTokens.forEach((token: string, index: number) => {
        console.log(`   Token ${index + 1}: ${token.substring(0, 20)}...`);
      });

      // Send to all tokens (handle multiple devices)
      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: userTokens[0], // Send to first token for now
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

      console.log('📩 [NOTIFICATIONS] API Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [NOTIFICATIONS] API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ [NOTIFICATIONS] Push notification API response:', result);
      
      if (result.success) {
        console.log('🎉 [NOTIFICATIONS] Push notification sent successfully!');
        console.log('   📱 Message ID:', result.messageId);
        console.log('   👤 To User:', userId);
        console.log('   💬 Title:', title);
        console.log('   📝 Body:', body);
      } else {
        console.error('❌ [NOTIFICATIONS] API returned success: false', result);
      }
      
      return result.success;

    } catch (error) {
      console.error('❌ [NOTIFICATIONS] Error sending push notification to user:', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      return false;
    }
  }, []);

  // ✅ TEST PUSH NOTIFICATION - WITH DETAILED LOGGING
  const testPushNotification = useCallback(async (title: string, body: string) => {
    // Get current token from localStorage
    let currentToken = localStorage.getItem('fcmToken');
    
    console.log('🧪 [NOTIFICATIONS] Starting test push notification...');
    console.log('   📱 Current FCM Token:', currentToken ? currentToken.substring(0, 30) + '...' : 'NOT FOUND');

    if (!currentToken) {
      console.log('❌ [NOTIFICATIONS] No FCM token available for test');
      alert('No FCM token available. Please enable notifications first.');
      return false;
    }

    try {
      console.log('📤 [NOTIFICATIONS] Sending test notification to API...');
      
      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: currentToken,
          title: title || 'Test Push Notification',
          body: body || 'This is a test push notification from your chat app! 🎉',
          data: {
            type: 'test',
            timestamp: new Date().toISOString(),
            test: true
          }
        }),
      });

      console.log('📩 [NOTIFICATIONS] Test API Response status:', response.status);

      const result = await response.json();
      console.log('📄 [NOTIFICATIONS] Test API Response:', result);
    
      if (!response.ok) {
        console.error('❌ [NOTIFICATIONS] Test API Error:', result);
        
        // If token is invalid, try to refresh it
        if (result.code === 'messaging/invalid-argument' || 
            result.code === 'messaging/invalid-registration-token') {
          
          console.log('🔄 [NOTIFICATIONS] Token invalid, attempting to refresh...');
          localStorage.removeItem('fcmToken');
          const newToken = await getFCMToken();
          
          if (newToken) {
            console.log('✅ [NOTIFICATIONS] New token generated');
            alert('Token was expired. New token generated. Please try again.');
          } else {
            alert('Token expired and failed to generate new one. Please refresh the page and enable notifications again.');
          }
          return false;
        }
        
        alert(`Error: ${result.error}\n\nCode: ${result.code}`);
        return false;
      }

      if (result.success) {
        console.log('🎉 [NOTIFICATIONS] Test push notification sent successfully!');
        console.log('   📱 Message ID:', result.messageId);
        alert('✅ Test notification sent! Check your device for push notification and browser console for logs.');
        return true;
      } else {
        console.error('❌ [NOTIFICATIONS] Test failed - API returned success: false', result);
        alert(`Error: ${result.error}`);
        return false;
      }

    } catch (error: any) {
      console.error('❌ [NOTIFICATIONS] Network error in test:', {
        error: error.message,
        stack: error.stack
      });
      alert(`Network Error: ${error.message}\n\nCheck browser console for detailed logs.`);
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