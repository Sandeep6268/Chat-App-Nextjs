// lib/firebase.ts - UPDATE WITH FCM
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging, isSupported } from 'firebase/messaging';

// 🔥 NEW TESTING PROJECT CONFIG
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDbm_Omf6O5OVoWulA6KaJjyDBr5V2Vy6A',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'chat-app-testing-234fc.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'chat-app-testing-234fc',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'chat-app-testing-234fc.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '1024725461365',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:1024725461365:web:3381b37b2593781ff38b3c',
};

// Validate configuration
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  throw new Error(
    'Firebase configuration error: Missing required environment variables. ' +
    'Check your .env.local file and ensure all NEXT_PUBLIC_FIREBASE_* variables are set.'
  );
}

// Initialize Firebase
let app;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  console.log('✅ Firebase initialized with NEW TESTING PROJECT');
} catch (error) {
  console.error('Firebase initialization error:', error);
  throw error;
}

// Initialize Firebase services
const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);

// Initialize Firebase Messaging (only on client side)
let messaging: any = null;

if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      messaging = getMessaging(app);
      console.log('✅ Firebase Messaging initialized');
    } else {
      console.log('❌ Firebase Messaging not supported in this environment');
    }
  }).catch((error) => {
    console.log('❌ Firebase Messaging initialization failed:', error);
  });
}

export { auth, firestore, storage, messaging };
export default app;