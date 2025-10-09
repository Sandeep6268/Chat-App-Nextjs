import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// 🔥 NEW TESTING PROJECT CONFIG
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDbm_Omf6O5OVoWulA6KaJjyDBr5V2Vy6A',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'chat-app-testing-234fc.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'chat-app-testing-234fc',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'chat-app-testing-234fc.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '1024725461365',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:1024725461365:web:3381b37b2593781ff38b3c'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

// Request notification permission and get FCM token
export const requestNotificationPermission = async (): Promise<string | null> => {
  if (!messaging) return null;
  
  try {
    // Use NEW VAPID KEY from environment
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || 'BGVsvUWSIEz1COSECmWhy0IkVmiNWC2Zfq5D4Cx-cGlWImCum46BL7Ce8KESD5wLQFagtd-UlHD72_RS7PFk2ZY';
    
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: vapidKey
      });
      console.log('✅ FCM Token received with NEW PROJECT:', token.substring(0, 20) + '...');
      return token;
    }
  } catch (error) {
    console.error('Error getting notification permission:', error);
  }
  return null;
};

// Handle foreground messages
export const onForegroundMessage = (callback: (payload: any) => void) => {
  if (!messaging) return () => {};
  
  return onMessage(messaging, (payload) => {
    console.log('📨 Foreground message from NEW PROJECT:', payload);
    callback(payload);
  });
};