import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

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
  if (!messaging) {
    console.log('❌ Messaging not available');
    return null;
  }
  
  try {
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || 'BGVsvUWSIEz1COSECmWhy0IkVmiNWC2Zfq5D4Cx-cGlWImCum46BL7Ce8KESD5wLQFagtd-UlHD72_RS7PFk2ZY';
    
    console.log('🔔 Requesting notification permission...');
    console.log('📱 Using VAPID Key:', vapidKey.substring(0, 20) + '...');
    
    const permission = await Notification.requestPermission();
    console.log('📋 Notification permission:', permission);
    
    if (permission === 'granted') {
      console.log('✅ Permission granted, getting FCM token...');
      const token = await getToken(messaging, {
        vapidKey: vapidKey
      });
      
      if (token) {
        console.log('✅ FCM Token received:', token.substring(0, 50) + '...');
        return token;
      } else {
        console.log('❌ No FCM token received');
        return null;
      }
    } else {
      console.log('❌ Notification permission denied');
      return null;
    }
  } catch (error) {
    console.error('❌ Error getting notification permission:', error);
    return null;
  }
};

// Handle foreground messages
export const onForegroundMessage = (callback: (payload: any) => void) => {
  if (!messaging) {
    console.log('❌ Messaging not available for foreground messages');
    return () => {};
  }
  
  console.log('👂 Setting up foreground message listener...');
  
  return onMessage(messaging, (payload) => {
    console.log('📨 Foreground message received:', payload);
    callback(payload);
  });
};