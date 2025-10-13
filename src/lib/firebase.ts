// lib/firebase.ts - FIXED VERSION
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
let app;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  console.log('✅ Firebase initialized');
} catch (error) {
  console.error('Firebase initialization error:', error);
  throw error;
}

// Initialize Firebase services
const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);

// Enable offline persistence for Firestore
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(firestore).catch((err) => {
    console.log('Firebase persistence error:', err);
  });
}

// FCM Messaging
let messaging: ReturnType<typeof getMessaging> | null = null;

const initializeMessaging = async () => {
  if (typeof window === 'undefined') return null;
  
  try {
    const supported = await isSupported();
    if (!supported) {
      console.log('❌ FCM not supported in this browser');
      return null;
    }

    messaging = getMessaging(app);
    
    // Configure FCM
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        console.log('✅ Service Worker ready for FCM');
      });
    }
    
    console.log('✅ FCM Messaging initialized');
    return messaging;
  } catch (error) {
    console.log('❌ FCM initialization failed:', error);
    return null;
  }
};

// Initialize messaging
initializeMessaging();

// FCM Token management
const getFCMToken = async (): Promise<string | null> => {
  if (!messaging) {
    console.log('❌ Messaging not available');
    return null;
  }

  try {
    // Request notification permission
    const permission = await Notification.requestPermission();
    console.log('📢 Notification permission:', permission);
    
    if (permission !== 'granted') {
      console.log('❌ Notification permission denied');
      return null;
    }

    // Get FCM token with VAPID key
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    });

    if (!token) {
      console.log('❌ No registration token available');
      return null;
    }

    console.log('✅ FCM Token obtained');
    return token;
  } catch (error) {
    console.error('❌ Error getting FCM token:', error);
    return null;
  }
};

// Listen for foreground messages
const onForegroundMessage = (callback: (payload: any) => void) => {
  if (!messaging) {
    console.log('❌ Messaging not available for foreground messages');
    return () => {};
  }

  return onMessage(messaging, (payload) => {
    console.log('📱 Received foreground message:', payload);
    callback(payload);
  });
};

export { 
  auth, 
  firestore, 
  storage, 
  messaging, 
  getFCMToken, 
  onForegroundMessage,
  initializeMessaging 
};
export default app;