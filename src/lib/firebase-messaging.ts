import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported, deleteToken } from 'firebase/messaging';

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

// Get messaging instance
export const getMessagingInstance = async () => {
  if (typeof window === 'undefined') return null;
  
  try {
    const isSupportedBrowser = await isSupported();
    if (!isSupportedBrowser) {
      console.log('🚫 FCM not supported in this browser');
      return null;
    }
    
    return getMessaging(app);
  } catch (error) {
    console.error('❌ Error getting messaging instance:', error);
    return null;
  }
};

// Register service worker
export const registerServiceWorker = async () => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    console.log('✅ Service Worker registered:', registration);
    return registration;
  } catch (error) {
    console.error('❌ Service Worker registration failed:', error);
    return null;
  }
};

// Get FCM token with better error handling
export const getFCMToken = async (): Promise<string | null> => {
  try {
    console.log('🔄 Getting FCM token...');
    
    // Register service worker first
    const registration = await registerServiceWorker();
    if (!registration) {
      console.log('❌ Service Worker registration failed');
      return null;
    }

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

    let permission = Notification.permission;
    
    if (permission === 'default') {
      console.log('🔄 Requesting notification permission...');
      permission = await Notification.requestPermission();
      console.log('📋 Permission result:', permission);
    }

    if (permission !== 'granted') {
      console.log('❌ Notification permission not granted:', permission);
      return null;
    }

    // Get FCM token with service worker scope
    console.log('🔑 Getting FCM token...');
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration
    });

    if (token) {
      console.log('✅ FCM Token received:', token.substring(0, 20) + '...');
      localStorage.setItem('fcmToken', token);
      return token;
    } else {
      console.log('❌ No FCM token received');
      return null;
    }
  } catch (error) {
    console.error('❌ Error getting FCM token:', error);
    
    // Specific error handling
    if (error instanceof Error) {
      if (error.message.includes('messaging/permission-blocked')) {
        console.log('🔕 Notifications blocked by user');
      } else if (error.message.includes('messaging/permission-default')) {
        console.log('🤔 Notification permission not granted');
      } else if (error.message.includes('messaging/unregistered')) {
        console.log('📱 App not registered');
      }
    }
    
    return null;
  }
};

// Delete FCM token
export const deleteFCMToken = async (): Promise<boolean> => {
  try {
    const messaging = await getMessagingInstance();
    if (!messaging) return false;

    const token = await getFCMToken();
    if (token) {
      await deleteToken(messaging);
      localStorage.removeItem('fcmToken');
      console.log('✅ FCM token deleted');
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Error deleting FCM token:', error);
    return false;
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
  
  try {
    const supported = await isSupported();
    const hasServiceWorker = 'serviceWorker' in navigator;
    const hasPushManager = 'PushManager' in window;
    
    console.log('🔍 FCM Support Check:', {
      fcmSupported: supported,
      serviceWorker: hasServiceWorker,
      pushManager: hasPushManager
    });
    
    return supported && hasServiceWorker && hasPushManager;
  } catch (error) {
    console.error('❌ Error checking FCM support:', error);
    return false;
  }
};