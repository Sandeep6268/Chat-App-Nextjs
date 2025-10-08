// lib/firebase-messaging.ts
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get messaging instance (only in browser)
export const getMessagingInstance = async () => {
  if (typeof window === 'undefined') return null;
  
  const isSupportedBrowser = await isSupported();
  if (!isSupportedBrowser) {
    console.log('🚫 FCM not supported in this browser');
    return null;
  }
  
  return getMessaging(app);
};

// Get FCM token
export const getFCMToken = async (): Promise<string | null> => {
  try {
    console.log('🔄 Getting FCM token...');
    
    const messaging = await getMessagingInstance();
    if (!messaging) {
      console.log('❌ Messaging not available');
      return null;
    }

    // Check notification permission
    if (!('Notification' in window)) {
      console.log('🚫 Notifications not supported');
      return null;
    }

    if (Notification.permission === 'denied') {
      console.log('❌ Notification permission denied');
      return null;
    }

    if (Notification.permission === 'default') {
      console.log('🔄 Requesting notification permission...');
      const permission = await Notification.requestPermission();
      console.log('📋 Permission result:', permission);
      
      if (permission !== 'granted') {
        console.log('❌ Notification permission not granted');
        return null;
      }
    }

    // Get FCM token
    console.log('🔑 Getting FCM token with VAPID key...');
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
    });

    if (token) {
      console.log('✅ FCM Token received:', token.substring(0, 20) + '...');
      return token;
    } else {
      console.log('❌ No FCM token received');
      return null;
    }
  } catch (error) {
    console.error('❌ Error getting FCM token:', error);
    return null;
  }
};

// Listen for foreground messages
export const onForegroundMessage = async (callback: (payload: any) => void) => {
  try {
    const messaging = await getMessagingInstance();
    if (!messaging) return;

    return onMessage(messaging, (payload) => {
      console.log('📱 Received foreground message:', payload);
      callback(payload);
    });
  } catch (error) {
    console.error('❌ Error setting up foreground message listener:', error);
  }
};

// Check if FCM is supported
export const isFCMSupported = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;
  return await isSupported();
};