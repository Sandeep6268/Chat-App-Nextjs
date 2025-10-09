import { initializeApp } from 'firebase/app';
import { 
  getMessaging, 
  getToken, 
  onMessage, 
  isSupported, 
  deleteToken 
} from 'firebase/messaging';

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

// VAPID Key - Firebase Console se milegi
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

export const getMessagingInstance = async () => {
  if (typeof window === 'undefined') return null;
  
  try {
    const supported = await isSupported();
    if (!supported) {
      console.warn('🚫 This browser does not support Firebase Cloud Messaging');
      return null;
    }
    return getMessaging(app);
  } catch (error) {
    console.error('❌ Error getting messaging instance:', error);
    return null;
  }
};

// Refresh FCM token
export const refreshFCMToken = async (): Promise<string | null> => {
  try {
    console.log('🔄 Refreshing FCM token...');
    
    // Delete old token
    const messaging = await getMessagingInstance();
    if (messaging) {
      try {
        const currentToken = await getFCMToken();
        if (currentToken) {
          await deleteToken(messaging);
          console.log('✅ Old token deleted');
        }
      } catch (error) {
        console.log('ℹ️ No token to delete or already expired');
      }
    }
    
    // Clear localStorage
    localStorage.removeItem('fcmToken');
    
    // Get new token
    const newToken = await getFCMToken();
    
    if (newToken) {
      console.log('✅ New FCM token generated:', newToken.substring(0, 20) + '...');
      return newToken;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error refreshing FCM token:', error);
    return null;
  }
};

// Add mobile-specific service worker registration
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.warn('🚫 Service Workers not supported');
    return null;
  }

  try {
    let registration;
    
    // ✅ FIXED: Try different service worker paths for mobile compatibility
    try {
      // First try root level
      registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });
    } catch (error) {
      console.log('🔄 Trying alternative service worker path...');
      // Try with different scope
      registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/firebase-cloud-messaging-push-scope',
        updateViaCache: 'none'
      });
    }

    console.log('✅ Service Worker registered:', registration);
    
    // Wait for activation
    if (registration.installing) {
      await new Promise(resolve => {
        registration.installing?.addEventListener('statechange', (e) => {
          if ((e.target as ServiceWorker).state === 'activated') {
            console.log('✅ Service Worker activated');
            resolve(null);
          }
        });
      });
    }
    
    return registration;
  } catch (error) {
    console.error('❌ Service Worker registration failed:', error);
    return null;
  }
};

// ✅ IMPROVED FCM TOKEN GENERATION
export const getFCMToken = async (): Promise<string | null> => {
  try {
    console.log('🔄 Getting FCM token...');

    // Step 1: Check browser support
    if (!('Notification' in window)) {
      console.warn('🚫 Notifications not supported in this browser');
      return null;
    }

    // Step 2: Check permission
    let permission = Notification.permission;
    
    if (permission === 'default') {
      console.log('🔄 Requesting notification permission...');
      permission = await Notification.requestPermission();
    }

    if (permission !== 'granted') {
      console.warn(`❌ Notification permission not granted: ${permission}`);
      return null;
    }

    // Step 3: Get messaging instance
    const messaging = await getMessagingInstance();
    if (!messaging) {
      console.warn('❌ Messaging not available');
      return null;
    }

    // Step 4: Register service worker
    const registration = await registerServiceWorker();
    if (!registration) {
      console.warn('❌ Service Worker registration failed');
      return null;
    }

    // Step 5: Get FCM token
    console.log('🔑 Generating FCM token with VAPID key...');
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    });

    if (token) {
      console.log('✅ FCM Token generated successfully');
      localStorage.setItem('fcmToken', token);
      return token;
    } else {
      console.warn('❌ No FCM token received');
      return null;
    }
  } catch (error) {
    console.error('❌ Error getting FCM token:', error);
    
    // Specific error handling
    if (error instanceof Error) {
      switch (error.message) {
        case 'messaging/permission-blocked':
          console.warn('🔕 Notifications blocked by user');
          break;
        case 'messaging/permission-default':
          console.warn('🤔 Notification permission not granted');
          break;
        case 'messaging/failed-service-worker-registration':
          console.warn('📱 Service Worker registration failed');
          break;
        default:
          console.warn('📱 Unknown error:', error.message);
      }
    }
    
    return null;
  }
};

// ✅ FOREGROUND MESSAGE HANDLER
export const onForegroundMessage = async (callback: (payload: any) => void) => {
  try {
    const messaging = await getMessagingInstance();
    if (!messaging) return;

    return onMessage(messaging, (payload) => {
      console.log('📱 Foreground message received:', payload);
      
      // Don't show browser notification in foreground
      // Let the callback handle it (toast, etc.)
      callback(payload);
    });
  } catch (error) {
    console.error('❌ Error setting up foreground message listener:', error);
  }
};

// ✅ DELETE TOKEN
export const deleteFCMToken = async (): Promise<boolean> => {
  try {
    const messaging = await getMessagingInstance();
    if (!messaging) return false;

    await deleteToken(messaging);
    localStorage.removeItem('fcmToken');
    console.log('✅ FCM token deleted');
    return true;
  } catch (error) {
    console.error('❌ Error deleting FCM token:', error);
    return false;
  }
};

// ✅ CHECK FCM SUPPORT
export const isFCMSupported = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;
  
  try {
    const supported = await isSupported();
    const hasServiceWorker = 'serviceWorker' in navigator;
    const hasPushManager = 'PushManager' in window;
    const isHttps = window.location.protocol === 'https:';
    const isLocalhost = window.location.hostname === 'localhost';

    console.log('🔍 FCM Support Check:', {
      fcmSupported: supported,
      serviceWorker: hasServiceWorker,
      pushManager: hasPushManager,
      https: isHttps,
      localhost: isLocalhost
    });

    return supported && hasServiceWorker && hasPushManager && (isHttps || isLocalhost);
  } catch (error) {
    console.error('❌ Error checking FCM support:', error);
    return false;
  }
};